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

const formatMessageTime = (timestamp) => {
  const messageDate = new Date(timestamp);
  const now = new Date();
  const diffTime = Math.abs(now - messageDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 0)
    return messageDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return messageDate.toLocaleDateString();
};

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
    try {
      const { data, error } = await supabase.rpc("add_request_message", {
        p_request_id: requestId,
        p_user_id: userId,
        p_message: message,
      });
      if (error) {
        console.error(error);
      }
    } catch (error) {
      console.error(error);
    }
    setMessage("");
    getMessages();
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
          <View style={styles.messageContainer}>
            <Text
              style={[
                styles.senderName,
                item.sender_id === userId
                  ? styles.sentSenderName
                  : styles.receivedSenderName,
              ]}
            >
              {`${item.user_first_name} ${item.user_last_name}`}
            </Text>
            <View
              style={[
                styles.messageBubble,
                item.sender_id === userId
                  ? styles.sentMessage
                  : styles.receivedMessage,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  item.sender_id === userId
                    ? styles.sentMessageText
                    : styles.receivedMessageText,
                ]}
              >
                {item.message}
              </Text>
              <Text
                style={[
                  styles.messageTime,
                  item.sender_id === userId
                    ? styles.sentMessageTime
                    : styles.receivedMessageTime,
                ]}
              >
                {formatMessageTime(item.created_at)}
              </Text>
            </View>
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
  messageContainer: {
    marginBottom: 16,
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
  senderName: {
    fontSize: 12,
    marginBottom: 4,
  },
  sentSenderName: {
    textAlign: "right",
    color: "#2196F3",
  },
  receivedSenderName: {
    textAlign: "left",
    color: "#757575",
  },
  messageText: {
    color: "#fff",
  },
  sentMessageText: {
    color: "#fff",
  },
  receivedMessageText: {
    color: "#000",
  },
  messageTime: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  sentMessageTime: {
    color: "rgba(255,255,255,0.7)",
  },
  receivedMessageTime: {
    color: "rgba(0,0,0,0.5)",
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
