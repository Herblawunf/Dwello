import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useEffect, useContext } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Context as AuthContext } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function ChatScreen() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const { requestId, description, tenant } = useLocalSearchParams();
  const {
    state: { userId },
  } = useContext(AuthContext);

  useEffect(() => {
    // Load initial messages
    getMessages();
  }, []);

  const getMessages = async () => {
    try {
      const { data, error } = await supabase.rpc("get_request_messages", {
        p_request_id: requestId,
      });
      if (data) {
        setMessages(data);
        return;
      }
      console.error(error);
    } catch (error) {
      console.error(error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    // TODO: Implement sending message to backend
    setMessage("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Request Thread</Text>
          <Text style={styles.subtitle}>{tenant}</Text>
        </View>
      </View>

      <View style={styles.requestInfo}>
        <Text style={styles.descriptionTitle}>Request:</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <FlatList
        data={messages}
        style={styles.messageList}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.sender_id === userId
                ? styles.sentMessage
                : styles.receivedMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.message}</Text>
            <Text style={styles.messageTime}>
              {new Date(item.created_at).toLocaleTimeString()}
            </Text>
          </View>
        )}
        keyExtractor={(item) => item.message_id.toString()}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <MaterialIcons name="send" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerInfo: {
    marginLeft: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    color: "#757575",
  },
  requestInfo: {
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#212121",
  },
  messageList: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  sentMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#2196F3",
  },
  receivedMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#E0E0E0",
  },
  messageText: {
    color: "#fff",
  },
  messageTime: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    alignSelf: "flex-end",
    padding: 8,
  },
});
