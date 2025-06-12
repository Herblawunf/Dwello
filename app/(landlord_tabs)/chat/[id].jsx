import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Context as AuthContext } from '@/context/AuthContext';
import { useContext } from 'react';
import * as ImagePicker from 'expo-image-picker';

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
      {message.attachment ? (
        <Image 
          source={{ uri: message.attachment }} 
          style={styles.messageImage}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.messageText, isOwnMessage ? styles.ownMessageText : styles.otherMessageText]}>
          {message.content}
        </Text>
      )}
      <Text style={[styles.messageTime, isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime]}>
        {new Date(message.sent).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
};

const ChatHeader = ({ group }) => {
  const router = useRouter();
  
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <View style={styles.headerInfo}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.memberCount}>{group.members?.length || 0} members</Text>
      </View>
      <TouchableOpacity style={styles.settingsButton}>
        <Ionicons name="settings-outline" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
};

const InputArea = ({ onSend, onAttach, selectedImage, onRemoveImage, isUploading }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() || selectedImage) {
      onSend(message, selectedImage);
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
      {selectedImage && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
          <TouchableOpacity onPress={onRemoveImage} style={styles.removeImageButton}>
            <Ionicons name="close-circle" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity 
        onPress={handleSend}
        style={[styles.sendButton, (!message.trim() && !selectedImage) && styles.sendButtonDisabled]}
        disabled={!message.trim() && !selectedImage || isUploading}
      >
        {isUploading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Ionicons name="send" size={24} color={(message.trim() || selectedImage) ? "#007AFF" : "#999"} />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default function ChatWindow() {
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [group, setGroup] = useState(null);
  const flatListRef = useRef(null);
  const { state: authState } = useContext(AuthContext);
  const userId = authState.userId;
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('group_id', id)
        .order('sent', { ascending: false });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [id]);

  const fetchGroupInfo = useCallback(async () => {
    try {
      const { data: groupData, error: groupError } = await supabase
        .from('chats')
        .select(`
          *,
          houses (
            street_address,
            postcode
          )
        `)
        .eq('group_id', id)
        .single();

      if (groupError) throw groupError;
      
      // Get members of the chat
      const { data: membersData, error: membersError } = await supabase
        .from('tenants')
        .select('tenant_id')
        .eq('house_id', groupData.house_id);

      if (membersError) throw membersError;

      setGroup({
        ...groupData,
        name: groupData.houses?.street_address || 'Chat',
        members: [...(membersData?.map(m => m.tenant_id) || []), userId]
      });
    } catch (error) {
      console.error('Error fetching group info:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchGroupInfo();
    fetchMessages();
  }, [fetchGroupInfo, fetchMessages]);

  const uploadImage = async (asset) => {
    if (!asset || !asset.uri) {
      Alert.alert("Error", "No image selected");
      return null;
    }

    setIsUploading(true);

    try {
      const uri = asset.uri;
      const fileExt = uri.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `chats/${fileName}`;

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: fileName,
        type: `image/${fileExt}`,
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chats')
        .upload(filePath, formData, {
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = await supabase.storage
        .from('chats')
        .getPublicUrl(filePath);

      setIsUploading(false);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
      setIsUploading(false);
      return null;
    }
  };

  const handleAttach = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSend = async (content, imageUri) => {
    try {
      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadImage({ uri: imageUri });
        if (!imageUrl) return;
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          group_id: id,
          sender: userId,
          content: content,
          attachment: imageUrl,
          sent: new Date().toISOString()
        });

      if (error) throw error;
      
      setSelectedImage(null);
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const renderMessage = useCallback(({ item }) => {
    const isOwnMessage = item.sender === userId;
    return <MessageBubble message={item} isOwnMessage={isOwnMessage} />;
  }, [userId]);

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          keyExtractor={item => item.message_id}
          inverted
          contentContainerStyle={styles.messageList}
        />
        <InputArea 
          onSend={handleSend} 
          onAttach={handleAttach} 
          selectedImage={selectedImage}
          onRemoveImage={() => setSelectedImage(null)}
          isUploading={isUploading}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginHorizontal: 8,
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
}); 