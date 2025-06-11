import React, { useState, useMemo } from 'react';
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

// Define initial chat data with sample messages and senders
const INITIAL_CHATS = [
    {
        id: '1', address: '123 Main St, Anytown, USA', messages: [
            { id: 'm1-1', text: 'Hello! Is the apartment still available?', sender: 'other', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) },
            { id: 'm1-2', text: 'Yes, it is. Are you interested in a viewing?', sender: 'user', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23) },
            { id: 'm1-3', text: 'I would love to! When are you free?', sender: 'other', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22) },
        ]
    },
    {
        id: '2', address: '456 Oak Ave, Springfield, IL', messages: [
            { id: 'm2-1', text: 'I saw your listing for Oak Ave. Can I get more details about the utilities?', sender: 'other', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
        ]
    },
    { id: '3', address: '789 Pine Ln, Boulder, CO', messages: [] }, // Chat with no messages
    {
        id: '4', address: '101 Maple Dr, Austin, TX', messages: [
            { id: 'm4-1', text: 'The previous tenant left the keys.', sender: 'user', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
            { id: 'm4-2', text: 'Great, I will pick them up tomorrow.', sender: 'other', timestamp: new Date(Date.now() - 1000 * 60 * 2) },
            { id: 'm4-3', text: 'Sounds good. Let me know once you have them.', sender: 'user', timestamp: new Date(Date.now() - 1000 * 60 * 1) },
        ]
    },
];

// Define approximate tab bar heights.
// These values are increased to provide more space.
// For iOS, typical tab bars + home indicator can take up significant space.
// For Android, this is an estimate for common tab bar heights.
// For more accuracy, consider using `useBottomTabBarHeight` from your navigation library if available.
const KEYBOARD_VERTICAL_OFFSET_IOS = 115; // Increased from 90
const KEYBOARD_VERTICAL_OFFSET_ANDROID = 75;  // Increased from 60


const ChatScreen = () => {
    const [chatsData, setChatsData] = useState(INITIAL_CHATS);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [messageText, setMessageText] = useState('');

    const selectedChat = useMemo(() => {
        return selectedChatId ? chatsData.find(chat => chat.id === selectedChatId) : null;
    }, [selectedChatId, chatsData]);

    const handleSelectChat = (chat) => {
        setSelectedChatId(chat.id);
    };

    const handleSendMessage = () => {
        if (messageText.trim() === '' || !selectedChatId) {
            return;
        }

        const newMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: messageText.trim(),
            sender: 'user', // New messages are from the current user
            timestamp: new Date(),
        };

        setChatsData(prevChatsData =>
            prevChatsData.map(chat =>
                chat.id === selectedChatId
                    ? { ...chat, messages: [...chat.messages, newMessage] }
                    : chat
            )
        );
        setMessageText('');
    };

    const renderChatListItem = ({ item }) => {
        const lastMessage = item.messages.length > 0 ? item.messages[item.messages.length - 1] : null;
        const previewText = lastMessage
            ? (lastMessage.text.length > 35 ? lastMessage.text.substring(0, 32) + "..." : lastMessage.text)
            : 'No messages yet.';

        return (
            <TouchableOpacity
                style={styles.chatListItem}
                onPress={() => handleSelectChat(item)}
            >
                <Text style={styles.chatListItemText}>{item.address}</Text>
                <Text style={styles.chatListItemSubtitle}>{previewText}</Text>
            </TouchableOpacity>
        );
    };

    const renderMessageItem = ({ item }) => (
        <View style={[
            styles.messageBubbleBase,
            item.sender === 'user' ? styles.userMessageBubble : styles.otherMessageBubble
        ]}>
            <Text style={item.sender === 'user' ? styles.userMessageText : styles.otherMessageText}>
                {item.text}
            </Text>
        </View>
    );

    if (selectedChat) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.chatKeyboardAvoidingView}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? KEYBOARD_VERTICAL_OFFSET_IOS : KEYBOARD_VERTICAL_OFFSET_ANDROID}
                >
                    <View style={styles.chatHeader}>
                        <Button title="< Back" onPress={() => setSelectedChatId(null)} />
                        <Text style={styles.chatTitle} numberOfLines={1} ellipsizeMode="tail">{selectedChat.address}</Text>
                    </View>

                    {selectedChat.messages.length === 0 ? (
                        <View style={styles.emptyChatContainer}>
                            <Text style={styles.noMessagesText}>No messages yet. Start the conversation!</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={selectedChat.messages}
                            renderItem={renderMessageItem}
                            keyExtractor={(item) => item.id}
                            style={styles.messagesList}
                            inverted // Shows latest messages at the bottom
                            contentContainerStyle={styles.messagesListContentContainer}
                        />
                    )}
                    
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.textInput}
                            value={messageText}
                            onChangeText={setMessageText}
                            placeholder="Type a message..."
                            multiline
                        />
                        <Button title="Send" onPress={handleSendMessage} />
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.listContainer}>
                <Text style={styles.title}>Group Chats</Text>
                <FlatList
                    data={chatsData}
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
    listContainer: {
        flex: 1,
        padding: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    chatListItemText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    chatListItemSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    chatKeyboardAvoidingView: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        backgroundColor: '#f8f8f8',
    },
    chatTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
        flex: 1,
        color: '#333',
    },
    emptyChatContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    noMessagesText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
    },
    messagesList: {
        flex: 1,
        paddingHorizontal: 10,
    },
    messagesListContentContainer: {
        paddingVertical: 10, 
    },
    messageBubbleBase: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 18,
        marginVertical: 5,
        maxWidth: '80%',
        minWidth: '15%',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    userMessageBubble: {
        backgroundColor: '#DCF8C6',
        alignSelf: 'flex-end',
        marginLeft: '20%',
    },
    otherMessageBubble: {
        backgroundColor: '#FFFFFF',
        alignSelf: 'flex-start',
        marginRight: '20%',
        borderWidth: Platform.OS === 'ios' ? 0.5 : 0.8,
        borderColor: '#E0E0E0',
    },
    userMessageText: {
        fontSize: 16,
        color: '#333',
    },
    otherMessageText: {
        fontSize: 16,
        color: '#333',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        backgroundColor: '#f8f8f8',
    },
    textInput: {
        flex: 1,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'ios' ? 10 : 8,
        paddingBottom: Platform.OS === 'ios' ? 10 : 8,
        marginRight: 10,
        backgroundColor: '#fff',
        fontSize: 16,
        minHeight: 40,
        maxHeight: 120, // Allow for a few lines of text
    },
});

export default ChatScreen;