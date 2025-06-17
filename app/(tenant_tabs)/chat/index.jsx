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
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const GroupChatItem = ({ group, onPress }) => {
  const theme = useTheme();
  
  return (
    <TouchableOpacity style={[styles.groupItem, { backgroundColor: theme.colors.surface }]} onPress={onPress}>
      <View style={styles.groupInfo}>
        <View style={styles.groupHeader}>
          <ThemedText type="defaultSemiBold" style={styles.groupName}>{group.name}</ThemedText>
          <ThemedText type="default" style={[styles.timestamp, { color: theme.colors.placeholder }]}>
            {group.lastMessage ? new Date(group.lastMessage.sent).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            }) : ''}
          </ThemedText>
        </View>
        <ThemedText type="default" style={[styles.lastMessage, { color: theme.colors.placeholder }]} numberOfLines={1}>
          {group.lastMessage?.content || 'No messages yet'}
        </ThemedText>
      </View>
      {group.unreadCount > 0 && (
        <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
          <ThemedText type="default" style={styles.unreadCount}>{group.unreadCount}</ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
};

const ChatListHeader = () => {
  const theme = useTheme();
  
  return (
    <ThemedView style={[styles.listHeader, { borderBottomColor: theme.colors.border }]}>
      <ThemedText type="title">Chats</ThemedText>
      <TouchableOpacity style={styles.searchButton}>
        <Ionicons name="search" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
    </ThemedView>
  );
};

export default function ChatScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const { state: authState } = useContext(AuthContext);
  const userId = authState.userId;
  const theme = useTheme();

  const fetchChats = useCallback(async () => {
    try {
      // Get the tenant's house
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('house_id')
        .eq('tenant_id', userId)
        .single();

      if (tenantError) throw tenantError;

      // First get all request_ids to filter out
      const { data: requests, error: requestError } = await supabase
        .from("requests")
        .select("request_id");

      if (requestError) {
        console.error("Error fetching requests:", requestError);
        throw requestError;
      }

      const requestIds = requests.map(req => req.request_id);

      // Get all chats for this house
      const { data: chats, error: chatError } = await supabase
        .from('chats')
        .select(`
          *,
          houses (
            street_address,
            postcode
          )
        `)
        .eq('house_id', tenantData.house_id);

      if (chatError) throw chatError;

      // Filter out chats where group_id matches any request_id
      const filteredChats = chats.filter(chat => 
        !requestIds.includes(chat.group_id)
      );

      // Get last messages for all chats
      const chatPromises = filteredChats.map(async (chat) => {
        const { data: messages, error: messageError } = await supabase
          .from('messages')
          .select('*')
          .eq('group_id', chat.group_id)
          .order('sent', { ascending: false })
          .limit(1);

        if (messageError) {
          console.error('Error fetching last message:', messageError);
          return null;
        }

        return {
          group_id: chat.group_id,
          name: chat.houses?.street_address || 'Property Chat',
          lastMessage: messages?.[0] || null,
          unreadCount: 0, // You can implement unread count logic later
          request_id: chat.request_id,
          tenants_only: chat.tenants_only
        };
      });

      const validChats = (await Promise.all(chatPromises)).filter(chat => chat !== null);
      setGroups(validChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  }, [userId]);

  React.useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleGroupPress = (group) => {
    router.push(`/(tenant_tabs)/chat/${group.group_id}`);
  };

  const renderGroupItem = useCallback(({ item }) => (
    <GroupChatItem group={item} onPress={() => handleGroupPress(item)} />
  ), []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ChatListHeader />
      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={item => item.group_id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
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
  },
  timestamp: {
    fontSize: 12,
  },
  lastMessage: {
    fontSize: 14,
  },
  unreadBadge: {
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
  },
});