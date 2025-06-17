import React, { useState, useCallback, useContext } from "react";
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Context as AuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useFocusEffect } from "@react-navigation/native";

const GroupChatItem = ({ group, onPress }) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[styles.groupItem, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
    >
      <View style={styles.groupInfo}>
        <View style={styles.groupHeader}>
          <ThemedText type="defaultSemiBold" style={styles.groupName}>
            {group.name}
          </ThemedText>
          <ThemedText
            type="default"
            style={[styles.timestamp, { color: theme.colors.placeholder }]}
          >
            {group.lastMessage
              ? new Date(group.lastMessage.sent).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })
              : ""}
          </ThemedText>
        </View>
        <ThemedText
          type="default"
          style={[styles.lastMessage, { color: theme.colors.placeholder }]}
          numberOfLines={1}
        >
          {group.lastMessage?.content || "No messages yet"}
        </ThemedText>
      </View>
      {group.unreadCount > 0 && (
        <View
          style={[
            styles.unreadBadge,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <ThemedText type="default" style={styles.unreadCount}>
            {group.unreadCount}
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
};

const ChatListHeader = () => {
  const theme = useTheme();

  return (
    <ThemedView
      style={[styles.listHeader, { borderBottomColor: theme.colors.border }]}
    >
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
      // Get all houses for this landlord
      const { data: houses, error: housesError } = await supabase
        .from("houses")
        .select("house_id, street_address")
        .eq("landlord_id", userId);

      if (housesError) {
        console.error("Error fetching houses:", housesError);
        throw housesError;
      }

      if (!houses || houses.length === 0) {
        console.log("No houses found for landlord:", userId);
        setGroups([]);
        return;
      }

      // Get all non-tenant-only chats for these houses
      const { data: chats, error: chatError } = await supabase
        .from("chats")
        .select(
          `
          *,
          houses (
            street_address,
            postcode
          )
        `
        )
        .in("house_id", houses.map(house => house.house_id))
        .eq("tenants_only", false);

      if (chatError) throw chatError;

      // Get last messages for all chats
      const chatPromises = chats.map(async (chat) => {
        const { data: messages, error: messageError } = await supabase
          .from("messages")
          .select("*")
          .eq("group_id", chat.group_id)
          .order("sent", { ascending: false })
          .limit(1);

        if (messageError) {
          console.error("Error fetching last message:", messageError);
          return null;
        }

        // Get unread message count
        const { data: unreadMessages, error: unreadError } = await supabase
          .from("messages")
          .select("message_id")
          .eq("group_id", chat.group_id)
          .not("sender", "eq", userId);

        if (unreadError) {
          console.error("Error fetching unread messages:", unreadError);
          return null;
        }

        // Get read messages for this user
        const { data: readMessages, error: readError } = await supabase
          .from("read_message")
          .select("message_id")
          .eq("user_id", userId)
          .in("message_id", unreadMessages.map(msg => msg.message_id));

        if (readError) {
          console.error("Error fetching read messages:", readError);
          return null;
        }

        const readMessageIds = new Set(readMessages.map(msg => msg.message_id));
        const unreadCount = unreadMessages.filter(msg => !readMessageIds.has(msg.message_id)).length;

        return {
          group_id: chat.group_id,
          name: chat.houses?.street_address || "Property Chat",
          lastMessage: messages?.[0] || null,
          unreadCount,
          request_id: chat.request_id,
          tenants_only: chat.tenants_only,
          house_id: chat.house_id
        };
      });

      const validChats = (await Promise.all(chatPromises))
        .filter((chat) => chat !== null)
        // Deduplicate chats by group_id
        .filter((chat, index, self) => 
          index === self.findIndex((c) => c.group_id === chat.group_id)
        );

      setGroups(validChats);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  }, [userId]);

  // Refresh chats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats])
  );

  // Add cleanup for any subscriptions
  React.useEffect(() => {
    let subscription;

    const setupSubscription = async () => {
      // Clean up any existing subscription
      if (subscription) {
        await supabase.removeChannel(subscription);
      }

      // Create new subscription
      subscription = supabase
        .channel('public:messages')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'messages' },
          () => {
            fetchChats(); // Refresh chats when new message arrives
          }
        )
        .subscribe();
    };

    fetchChats();
    setupSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [fetchChats]);

  const handleGroupPress = (group) => {
    router.push(`/(landlord_tabs)/chat/${group.group_id}`);
  };

  const renderGroupItem = useCallback(
    ({ item }) => (
      <GroupChatItem group={item} onPress={() => handleGroupPress(item)} />
    ),
    []
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ChatListHeader />
      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item.group_id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => (
          <View
            style={[styles.separator, { backgroundColor: theme.colors.border }]}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  groupInfo: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  unreadCount: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
  },
  separator: {
    height: 1,
  },
});
