import createDataContext from "./createDataContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const jwtDecode = (accessToken) => {
  return { id: 12345 };
};

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
  async ({ username, password }) => {
    try {
      tokenResponse = { access_token: "dummy" };
      if (tokenResponse.hasOwnProperty("access_token")) {
        AsyncStorage.setItem("accessToken", tokenResponse.access_token);
        dispatch({ type: "login", payload: tokenResponse.access_token });
      } else {
        // Error sent back as response
        throw tokenResponse;
      }
    } catch (err) {
      console.log(err);
    }
  };

const signout = (dispatch) => async () => {
  await AsyncStorage.removeItem("accessToken");
  dispatch({ type: "signout" });
};

const clearErrorMessage = (dispatch) => () => {
  dispatch({ type: "set_error_message", payload: "" });
};

const tryLocalLogin = (dispatch) => async () => {
  // const accessToken = await AsyncStorage.getItem("accessToken");
  const accessToken = "dummy";
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
