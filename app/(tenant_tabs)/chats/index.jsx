// /app/(tabs)/chat/index.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

/**
 * We remove `tabBarButton: () => null` from here—
 * hiding the tab is now handled by the `_layout.jsx` trick above.
 * We do still export `headerShown: false` so Expo Router
 * won’t insert its own header above our Chat UI.
 */
export const options = {
  tabBarButton: () => null,
  headerShown: false,  // optional: hide any default header if you want.
};

export default function ChatScreen() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');

  const chatRooms = [
    {
      id: 1,
      title: 'Housemates',
      lastMessage: 'Hey, who left dishes in the sink?',
      time: '2:30 PM',
    },
    {
      id: 2,
      title: 'Landlord',
      lastMessage: 'Rent is due on the 1st',
      time: '1:15 PM',
    },
  ];

  const sendMessage = async () => {
    if (messageText.trim()) {
      console.log('Sending message:', messageText, 'to chat:', selectedChat);
      // await sendMessageToDatabase(selectedChat, messageText);
      setMessageText('');
    }
  };

  const loadChatMessages = async (chatId) => {
    console.log('Loading messages for chat:', chatId);
    // return await getChatMessagesFromDatabase(chatId);
  };

  const renderChatList = () => (
    <View style={styles.chatList}>
      <Text style={styles.header}>Messages</Text>
      {chatRooms.map((chat) => (
        <TouchableOpacity
          key={chat.id}
          style={styles.chatItem}
          onPress={() => {
            setSelectedChat(chat.id);
            loadChatMessages(chat.id);
          }}
        >
          <View style={styles.chatItemContent}>
            <Text style={styles.chatTitle}>{chat.title}</Text>
            <Text style={styles.lastMessage}>{chat.lastMessage}</Text>
          </View>
          <Text style={styles.chatTime}>{chat.time}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderChatWindow = () => (
    <KeyboardAvoidingView
      style={styles.chatWindow}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => setSelectedChat(null)}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.chatHeaderTitle}>
          {chatRooms.find((chat) => chat.id === selectedChat)?.title}
        </Text>
      </View>

      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {/* Messages would be rendered here from database */}
        <Text style={styles.placeholderText}>
          Messages will appear here...
        </Text>
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <View style={styles.outerContainer}>
      <SafeAreaView style={styles.container}>
        {selectedChat ? renderChatWindow() : renderChatList()}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: 85, // Space for tab bar
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chatList: {
    flex: 1,
    paddingBottom: 90, // Add padding to account for tab bar
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatItemContent: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  chatWindow: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 15,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesContent: {
    padding: 15,
    paddingBottom: 20,
  },
  placeholderText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginTop: 50,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    backgroundColor: '#fff',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});