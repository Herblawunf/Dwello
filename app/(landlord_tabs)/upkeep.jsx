import React from "react";
import { View, StyleSheet } from "react-native";
import { NotionCalendar } from "../components";

// Sample maintenance events
const MAINTENANCE_EVENTS = [
  {
    id: '1',
    title: 'AC Filter Replacement',
    date: '2025-06-09',
    priority: 'Routine',
    property: 'Sunset Apartments',
    category: 'HVAC',
    description: 'Regular maintenance of AC filters',
  },
  {
    id: '2',
    title: 'Leaky Faucet Repair',
    date: '2025-06-10',
    priority: 'Urgent',
    property: 'Ocean View Condos',
    category: 'Plumbing',
    description: 'Fix leaking faucet in Unit 302',
  },
  {
    id: '3',
    title: 'Light Bulb Replacement',
    date: '2025-06-11',
    priority: 'Minor',
    property: 'Mountain View Homes',
    category: 'Electrical',
    description: 'Replace burnt out light bulbs in common areas',
  },
  {
    id: '4',
    title: 'Lawn Maintenance',
    date: '2025-06-12',
    priority: 'Routine',
    property: 'Sunset Apartments',
    category: 'Landscaping',
    description: 'Regular lawn mowing and maintenance',
  },
  {
    id: '5',
    title: 'Smoke Detector Check',
    date: '2025-06-13',
    priority: 'Urgent',
    property: 'Ocean View Condos',
    category: 'General',
    description: 'Check and replace smoke detector batteries',
  },
  {
    id: '6',
    title: 'Window Cleaning',
    date: '2025-06-14',
    priority: 'Minor',
    property: 'Mountain View Homes',
    category: 'General',
    description: 'Clean windows in all units',
  },
  {
    id: '7',
    title: 'HVAC System Inspection',
    date: '2025-06-15',
    priority: 'Routine',
    property: 'Sunset Apartments',
    category: 'HVAC',
    description: 'Annual HVAC system inspection and maintenance',
  },
  {
    id: '8',
    title: 'Emergency Plumbing',
    date: '2025-06-03',
    priority: 'Urgent',
    property: 'Ocean View Condos',
    category: 'Plumbing',
    description: 'Fix burst pipe in basement',
  },
  {
    id: '9',
    title: 'Garden Maintenance',
    date: '2025-06-22',
    priority: 'Minor',
    property: 'Mountain View Homes',
    category: 'Landscaping',
    description: 'Regular garden maintenance and plant care',
  },
  {
    id: '10',
    title: 'Electrical Panel Check',
    date: '2025-06-28',
    priority: 'Routine',
    property: 'Sunset Apartments',
    category: 'Electrical',
    description: 'Inspect and test electrical panels',
  },
  {
    id: '11',
    title: 'Pest Control Visit',
    date: '2025-06-05',
    priority: 'Routine',
    property: 'Ocean View Condos',
    category: 'General',
    description: 'Monthly pest control inspection and treatment',
  },
  {
    id: '12',
    title: 'Fire Safety Inspection',
    date: '2025-06-19',
    priority: 'Urgent',
    property: 'Mountain View Homes',
    category: 'General',
    description: 'Quarterly fire safety system inspection',
  }
];

export default function UpkeepScreen() {
  return (
    <View style={styles.container}>
      <NotionCalendar events={MAINTENANCE_EVENTS} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
}); 