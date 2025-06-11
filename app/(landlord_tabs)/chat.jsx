import React, { useState } from 'react';
import {

View,
Text,
TextInput,
Button,
FlatList,
TouchableOpacity,
StyleSheet,
SafeAreaView,
KeyboardAvoidingView,
Platform,
} from 'react-native';

const MOCK_CHATS = [
{ id: '1', address: '123 Main St, Anytown, USA', messages: [] },
{ id: '2', address: '456 Oak Ave, Springfield, IL', messages: [] },
{ id: '3', address: '789 Pine Ln, Boulder, CO', messages: [] },
{ id: '4', address: '101 Maple Dr, Austin, TX', messages: [] },
];

const ChatScreen = () => {
const [selectedChat, setSelectedChat] = useState(null);
const [messageText, setMessageText] = useState('');

const handleSelectChat = (chat) => {
    setSelectedChat(chat);
};

const handleSendMessage = () => {
    if (messageText.trim() === '') {
        return;
    }
    // In a real app, you would send the message here
    console.log(`Sending message to ${selectedChat?.address}: ${messageText}`);
    setMessageText(''); // Clear the input field
};

const renderChatListItem = ({ item }) => (
    <TouchableOpacity
        style={styles.chatListItem}
        onPress={() => handleSelectChat(item)}
    >
        <Text style={styles.chatListItemText}>{item.address}</Text>
    </TouchableOpacity>
);

if (selectedChat) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.chatHeader}>
                    <Button title="< Back" onPress={() => setSelectedChat(null)} />
                    <Text style={styles.chatTitle}>{selectedChat.address}</Text>
                </View>
                <View style={styles.messagesContainer}>
                    {/* Messages would be displayed here */}
                    <Text style={styles.noMessagesText}>No messages yet.</Text>
                </View>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        value={messageText}
                        onChangeText={setMessageText}
                        placeholder="Type a message..."
                    />
                    <Button title="Send" onPress={handleSendMessage} />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
            <Text style={styles.title}>Group Chats</Text>
            <FlatList
                data={MOCK_CHATS}
                renderItem={renderChatListItem}
                keyExtractor={(item) => item.id}
                style={styles.chatList}
            />
        </View>
    </SafeAreaView>
);
};

const styles = StyleSheet.create({
safeArea: {
    flex: 1,
    backgroundColor: '#f0f0f0',
},
container: {
    flex: 1,
    padding: 10,
},
title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
},
chatList: {
    flex: 1,
},
chatListItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
},
chatListItemText: {
    fontSize: 16,
},
chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
},
chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
},
messagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
},
noMessagesText: {
    fontSize: 16,
    color: '#888',
},
inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
},
textInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: '#fff',
},
});

export default ChatScreen;