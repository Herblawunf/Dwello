import createDataContext from "./createDataContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import jwtDecode from "jwt-decode";
import { supabase } from "../lib/supabase";

const getUserId = (accessToken) => {
  if (!accessToken || typeof accessToken !== 'string') {
    return null;
  }
  try {
    return jwtDecode(accessToken).sub; // Supabase uses 'sub' not 'id'
  } catch (error) {
    console.log('Error decoding token:', error);
    return null;
  }
};

// Helper function to validate if token is a valid JWT
const isValidToken = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  try {
    const decoded = jwtDecode(token);
    // Check if token is expired
    const currentTime = Date.now() / 1000;
    if (decoded.exp && decoded.exp < currentTime) {
      console.log('Token is expired');
      return false;
    }
    return true;
  } catch (error) {
    console.log('Invalid token format:', error);
    return false;
  }
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "login":
      return {
        ...state,
        accessToken: action.payload,
        userId: getUserId(action.payload),
        errorMessage: "",
        isSignedIn: true,
      };
    case "set_error_message":
      return { ...state, errorMessage: action.payload };
    case "signout":
      return {
        ...state,
        accessToken: null, // Fixed: was 'token', should be 'accessToken'
        userId: null,
        errorMessage: "",
        isSignedIn: false,
      };
    case "attempted_local":
      return { ...state, hasAttemptedLocalLogin: true };
    default:
      return state;
  }
};

const login =
  (dispatch) =>
  async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        dispatch({ type: "set_error_message", payload: error.message });
        return;
      }

      const accessToken = data.session.access_token;
      await AsyncStorage.setItem("accessToken", accessToken);

      dispatch({ type: "login", payload: accessToken });
    } catch (err) {
      console.log(err);
      dispatch({ type: "set_error_message", payload: "Login failed" });
    }
  };

const signout = (dispatch) => async () => {
  try {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem("accessToken");
    dispatch({ type: "signout" });
  } catch (error) {
    console.log('Error signing out:', error);
    // Still dispatch signout to clear local state
    dispatch({ type: "signout" });
  }
};

const clearErrorMessage = (dispatch) => () => {
  dispatch({ type: "set_error_message", payload: "" });
};

const tryLocalLogin = (dispatch) => async () => {
  try {
    const accessToken = await AsyncStorage.getItem("accessToken");
    
    // Only proceed if we have a valid token
    if (accessToken && isValidToken(accessToken)) {
      console.log('Valid token found, logging in');
      dispatch({ type: "login", payload: accessToken });
    } else {
      // Remove invalid token from storage
      if (accessToken) {
        console.log('Invalid token found, removing from storage');
        await AsyncStorage.removeItem("accessToken");
      }
    }
  } catch (error) {
    console.log('Error in tryLocalLogin:', error);
    // Clear any potentially corrupted token
    await AsyncStorage.removeItem("accessToken");
  }

  dispatch({ type: "attempted_local" });
};

export const { Provider, Context } = createDataContext(
  authReducer,
  { login, signout, clearErrorMessage, tryLocalLogin },
  {
    accessToken: null,
    userId: null,
    errorMessage: "",
    hasAttemptedLocalLogin: false,
    isSignedIn: false,
  }
);