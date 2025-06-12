import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useLocalSearchParams } from 'expo-router';

// Placeholder data - replace with actual API calls
const MOCK_MESSAGES = [
  {
    id: '1',
    senderId: 'user1',
    content: 'Hello, I have a question about the property',
    type: 'text',
    timestamp: new Date(),
    readBy: ['user1', 'user2'],
  },
  {
    id: '2',
    senderId: 'user2',
    content: 'Sure, what would you like to know?',
    type: 'text',
    timestamp: new Date(),
    readBy: ['user1', 'user2'],
  },
];

const MessageBubble = ({ message, isOwnMessage }) => {
  return (
    <View style={[styles.messageBubble, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
      <Text style={[styles.messageText, isOwnMessage ? styles.ownMessageText : styles.otherMessageText]}>
        {message.content}
      </Text>
      <Text style={[styles.messageTime, isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime]}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
};

const ChatHeader = ({ group }) => {
  const navigation = useNavigation();
  
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <View style={styles.headerInfo}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.memberCount}>{group.members.length} members</Text>
      </View>
      <TouchableOpacity style={styles.settingsButton}>
        <Ionicons name="settings-outline" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
};

const InputArea = ({ onSend, onAttach }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <View style={styles.inputContainer}>
      <TouchableOpacity onPress={onAttach} style={styles.attachButton}>
        <Ionicons name="attach" size={24} color="#666" />
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="Type a message..."
        multiline
        maxLength={1000}
      />
      <TouchableOpacity 
        onPress={handleSend}
        style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
        disabled={!message.trim()}
      >
        <Ionicons name="send" size={24} color={message.trim() ? "#007AFF" : "#999"} />
      </TouchableOpacity>
    </View>
  );
};

export default function ChatWindow() {
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const flatListRef = useRef(null);

  // In a real app, you would fetch the group data based on the id
  const group = {
    id,
    name: '123 Main Street',
    members: ['user1', 'user2', 'user3'],
  };

  const handleSend = (content) => {
    const newMessage = {
      id: Date.now().toString(),
      senderId: 'user1', // Replace with actual user ID
      content,
      type: 'text',
      timestamp: new Date(),
      readBy: ['user1'],
    };
    setMessages(prev => [newMessage, ...prev]);
  };

  const handleAttach = () => {
    // Implement file attachment logic
    console.log('Attach file');
  };

  const renderMessage = useCallback(({ item }) => {
    const isOwnMessage = item.senderId === 'user1'; // Replace with actual user ID
    return <MessageBubble message={item} isOwnMessage={isOwnMessage} />;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ChatHeader group={group} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          inverted
          contentContainerStyle={styles.messageList}
        />
        <InputArea onSend={handleSend} onAttach={handleAttach} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
  },
  settingsButton: {
    marginLeft: 16,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    marginVertical: 4,
  },
  ownMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    paddingBottom: 54, // Account for tab bar
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
}); 