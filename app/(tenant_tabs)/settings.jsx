import { useContext } from "react";
import { supabase } from "../../lib/supabase";
import { TouchableOpacity, Text } from "react-native";
import { Context as AuthContext } from "@/context/AuthContext";

export default function SettingsScreen() {
  const { state: authState, signout } = useContext(AuthContext);
  const handleSignout = async () => {
    await supabase.auth.signOut();
    signout();
    console.log(authState.isSignedIn);
  };
  return (
    <TouchableOpacity onPress={handleSignout}>
      <Text>Signout</Text>
    </TouchableOpacity>
  );
}
