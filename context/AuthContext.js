import createDataContext from "./createDataContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { supabase } from "../lib/supabase";

const getUserId = (accessToken) => {
  return accessToken != null ? jwtDecode(accessToken).sub : null;
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
        tenant: action.userInfo?.tenant || false,
        landlord: action.userInfo?.landlord || false,
        hasHouse: action.userInfo?.hasHouse || false,
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
        tenant: false,
        landlord: false,
        hasHouse: false,
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

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: userInfo, error: userInfoError } = await supabase
        .from("users")
        .select("landlord, tenant")
        .eq("id", user.id)
        .single();
      console.log(user.id);
      console.log("User Info:", userInfo);

      // Check if user has a house
      const { data: tenantInfo, error: tenantError } = await supabase
        .from("tenants")
        .select("has_house")
        .eq("tenant_id", user.id)
        .single();

      const hasHouse = tenantInfo?.has_house || false;

      const accessToken = data.session.access_token;
      await AsyncStorage.setItem("accessToken", accessToken);
      // Store landlord and tenant flags as strings
      await AsyncStorage.setItem(
        "landlord",
        JSON.stringify(userInfo?.landlord || false)
      );
      await AsyncStorage.setItem(
        "tenant",
        JSON.stringify(userInfo?.tenant || false)
      );
      await AsyncStorage.setItem("hasHouse", JSON.stringify(hasHouse));

      dispatch({ 
        type: "login", 
        payload: accessToken, 
        userInfo: { ...userInfo, hasHouse } 
      });
    } catch (err) {
      console.log(err);
    }
  };

const signout = (dispatch) => async () => {
  await supabase.auth.signOut();
  await AsyncStorage.removeItem("accessToken");
  await AsyncStorage.removeItem("tenant");
  await AsyncStorage.removeItem("landlord");
  await AsyncStorage.removeItem("hasHouse");

  dispatch({ type: "signout" });
};

const clearErrorMessage = (dispatch) => () => {
  dispatch({ type: "set_error_message", payload: "" });
};

const tryLocalLogin = (dispatch) => async () => {
  const accessToken = await AsyncStorage.getItem("accessToken");
  if (accessToken) {
    // Restore landlord and tenant from AsyncStorage
    const landlordStr = await AsyncStorage.getItem("landlord");
    const tenantStr = await AsyncStorage.getItem("tenant");
    const hasHouseStr = await AsyncStorage.getItem("hasHouse");
    const userInfo = {
      landlord: landlordStr ? JSON.parse(landlordStr) : false,
      tenant: tenantStr ? JSON.parse(tenantStr) : false,
      hasHouse: hasHouseStr ? JSON.parse(hasHouseStr) : false,
    };
    dispatch({ type: "login", payload: accessToken, userInfo });
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
    landlord: false,
    tenant: false,
    hasHouse: false,
  }
);
