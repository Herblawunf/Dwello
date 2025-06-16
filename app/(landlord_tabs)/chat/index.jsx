import React, { useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Context as AuthContext } from '@/context/AuthContext';

const GroupChatItem = ({ group, onPress }) => {
  return (
    <TouchableOpacity style={styles.groupItem} onPress={onPress}>
      <View style={styles.groupInfo}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupName}>{group.street_address}</Text>
          <Text style={styles.timestamp}>
            {group.lastMessage ? new Date(group.lastMessage.sent).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            }) : ''}
          </Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {group.lastMessage?.content || 'No messages yet'}
        </Text>
      </View>
      {group.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{group.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const ChatListHeader = () => {
  return (
    <View style={styles.listHeader}>
      <Text style={styles.headerTitle}>Property Chats</Text>
      <TouchableOpacity style={styles.searchButton}>
        <Ionicons name="search" size={24} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
};

export default function ChatScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const { state: authState } = useContext(AuthContext);
  const userId = authState.userId;

  const fetchChats = useCallback(async () => {
    try {
      // Get all houses owned by the landlord
      const { data: houses, error: housesError } = await supabase
        .from('houses')
        .select('*')
        .eq('landlord_id', userId);

      if (housesError) throw housesError;

      // For each house, get or create a chat group and get its last message
      const groupsWithMessages = await Promise.all(
        houses.map(async (house) => {
          // Get existing chat for this house
          let { data: chat, error: chatError } = await supabase
            .from('chats')
            .select('*')
            .eq('house_id', house.house_id)
            .single();

          // If no chat exists, create one
          if (!chat) {
            const { data: newChat, error: createError } = await supabase
              .from('chats')
              .insert({
                house_id: house.house_id,
                tenants_only: false
              })
              .select()
              .single();

            if (createError) throw createError;
            chat = newChat;
          }

          // Get the last message for this chat
          const { data: messages, error: messageError } = await supabase
            .from('messages')
            .select('*')
            .eq('group_id', chat.group_id)
            .order('sent', { ascending: false })
            .limit(1);

          if (messageError) {
            console.error('Error fetching last message:', messageError);
          }

          const lastMessage = messages?.[0] || null;

          return {
            ...house,
            group_id: chat.group_id,
            lastMessage,
            unreadCount: 0 // You can implement unread count logic later
          };
        })
      );

      // Sort groups by last message timestamp, with groups without messages at the end
      const sortedGroups = groupsWithMessages.sort((a, b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.sent) - new Date(a.lastMessage.sent);
      });

      setGroups(sortedGroups);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  }, [userId]);

  React.useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleGroupPress = (group) => {
    router.push(`/chat/${group.group_id}`);
  };

  const renderGroupItem = useCallback(({ item }) => (
    <GroupChatItem group={item} onPress={() => handleGroupPress(item)} />
  ), []);

  return (
    <SafeAreaView style={styles.container}>
      <ChatListHeader />
      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={item => item.group_id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchButton: {
    padding: 8,
  },
  listContent: {
    paddingBottom: 54, // Account for tab bar
  },
  groupItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
}); 