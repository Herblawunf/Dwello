import React, { useState, useCallback } from 'react';
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

// Placeholder data - replace with actual API calls
const MOCK_GROUPS = [
  {
    id: 'group1',
    propertyId: 'property1',
    name: '123 Main Street',
    members: ['user1', 'user2', 'user3'],
    lastMessage: {
      content: 'Sure, what would you like to know?',
      timestamp: new Date(),
    },
    unreadCount: 2,
  },
  {
    id: 'group2',
    propertyId: 'property2',
    name: '456 Oak Avenue',
    members: ['user1', 'user4', 'user5'],
    lastMessage: {
      content: 'The maintenance request has been approved',
      timestamp: new Date(Date.now() - 3600000),
    },
    unreadCount: 0,
  },
  {
    id: 'group3',
    propertyId: 'property3',
    name: '789 Pine Road',
    members: ['user1', 'user6', 'user7'],
    lastMessage: {
      content: 'New tenant has been assigned',
      timestamp: new Date(Date.now() - 86400000),
    },
    unreadCount: 5,
  },
];

const GroupChatItem = ({ group, onPress }) => {
  return (
    <TouchableOpacity style={styles.groupItem} onPress={onPress}>
      <View style={styles.groupInfo}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.timestamp}>
            {new Date(group.lastMessage.timestamp).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {group.lastMessage.content}
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
  const [groups, setGroups] = useState(MOCK_GROUPS);

  const handleGroupPress = (group) => {
    router.push(`/chat/${group.id}`);
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
        keyExtractor={item => item.id}
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