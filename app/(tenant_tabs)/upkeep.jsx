import React, { useState, useContext, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { NotionCalendar } from "../components";
import { Context as AuthContext } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function UpkeepScreen() {
  const [maintenanceEvents, setMaintenanceEvents] = useState([]);
  const { state: authState } = useContext(AuthContext);

  const getEvents = async () => {
    try {
      const { data, error } = await supabase.rpc("get_tenant_house_events", {
        p_tenant_id: authState.userId,
      });
      if (data) {
        setMaintenanceEvents(data);
        console.log(data);
        return;
      }
      console.error(error);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  useEffect(() => {
    getEvents();
  }, [authState.userId]);

  const handleTaskUpdate = (updatedTask) => {
    const updatedEvents = maintenanceEvents.map((event) =>
      event.id === updatedTask.id ? updatedTask : event
    );
    setMaintenanceEvents(updatedEvents);
  };

  return (
    <View style={styles.container}>
      <NotionCalendar
        events={maintenanceEvents}
        onTaskUpdate={handleTaskUpdate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
