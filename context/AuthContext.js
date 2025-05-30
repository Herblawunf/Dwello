import createDataContext from "./createDataContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { supabase } from "../lib/supabase";

const getUserId = (accessToken) => {
  return accessToken != null ? jwtDecode(accessToken).id : null;
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
        token: null,
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
    }
  };

const signout = (dispatch) => async () => {
  await supabase.auth.signOut();
  await AsyncStorage.removeItem("accessToken");

  dispatch({ type: "signout" });
};

const clearErrorMessage = (dispatch) => () => {
  dispatch({ type: "set_error_message", payload: "" });
};

const tryLocalLogin = (dispatch) => async () => {
  AsyncStorage.clear();
  const accessToken = await AsyncStorage.getItem("accessToken");
  if (accessToken) {
    dispatch({ type: "login", payload: accessToken });
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
