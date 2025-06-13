import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, ScrollView, Dimensions, Pressable, Animated } from "react-native";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, addDays } from "date-fns";

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 49; // Standard tab bar height
const TOP_BAR_HEIGHT = 60; // Approximate top bar height
const BOTTOM_PADDING = 100; // Increased bottom padding
const CALENDAR_HEIGHT = SCREEN_HEIGHT - TAB_BAR_HEIGHT - TOP_BAR_HEIGHT - BOTTOM_PADDING;

// Get screen width for calculations
const screenWidth = Dimensions.get('window').width;
const dayWidth = (screenWidth - 40) / 7; // 7 days per row
const dayHeight = 100; // Fixed height for each day cell
const weekDayHeight = 160; // Taller height for week view

// Category colors
const CATEGORY_COLORS = {
  'HVAC': '#FF4444',
  'Plumbing': '#44BB44',
  'Electrical': '#FFA500',
  'Landscaping': '#44BB44',
  'General': '#666666',
};

// Priority colors
const PRIORITY_COLORS = {
  'Urgent': '#FF4444',
  'Routine': '#FFA500',
  'Minor': '#44BB44',
};

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

// View Toggle Component
const ViewToggle = ({ viewMode, onToggle }) => (
  <View style={styles.viewToggle}>
    <TouchableOpacity
      style={[styles.toggleButton, viewMode === 'month' && styles.toggleButtonActive]}
      onPress={() => onToggle('month')}
    >
      <Text style={[styles.toggleText, viewMode === 'month' && styles.toggleTextActive]}>Month</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.toggleButton, viewMode === 'week' && styles.toggleButtonActive]}
      onPress={() => onToggle('week')}
    >
      <Text style={[styles.toggleText, viewMode === 'week' && styles.toggleTextActive]}>Week</Text>
    </TouchableOpacity>
  </View>
);

// MiniTaskCard component for in-cell task display
const MiniTaskCard = ({ task, onPress }) => {
  const priorityColor = PRIORITY_COLORS[task.priority] || '#6B7280';
  const categoryColor = CATEGORY_COLORS[task.category] || '#6B7280';
  
  return (
    <TouchableOpacity
      onPress={() => onPress(task)}
      style={styles.miniCard}
    >
      <View style={styles.miniCardContent}>
        <Text style={styles.miniCardTitle} numberOfLines={1}>
          {task.title}
        </Text>
        <View style={styles.miniCardTags}>
          <View style={[styles.miniTag, { backgroundColor: `${priorityColor}15` }]}>
            <View style={[styles.miniTagDot, { backgroundColor: priorityColor }]} />
            <Text style={[styles.miniTagText, { color: priorityColor }]} numberOfLines={1}>
              {task.priority}
            </Text>
          </View>
          <View style={[styles.miniTag, { backgroundColor: `${categoryColor}15` }]}>
            <Text style={[styles.miniTagText, { color: categoryColor }]} numberOfLines={1}>
              {task.category}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// DayCell component for calendar grid
const DayCell = ({ date, state, events, onDayPress, onTaskPress, isWeekView = false }) => {
  const isToday = state === 'today';
  const isSelected = state === 'selected';
  const isDisabled = state === 'disabled';
  const isOutOfMonth = state === 'disabled';
  const hasEvents = events && events.length > 0;

  return (
    <TouchableOpacity
      style={[
        styles.dayCell,
        isWeekView && styles.weekDayCell,
        isToday && styles.todayCell,
        isSelected && styles.selectedCell,
        isDisabled && styles.disabledCell,
        isOutOfMonth && styles.outOfMonthCell,
        hasEvents && styles.hasEventsCell,
      ]}
      onPress={() => onDayPress(date)}
      disabled={isDisabled}
    >
      <Text style={[
        styles.dayNumber,
        isToday && styles.todayText,
        isSelected && styles.selectedText,
        isDisabled && styles.disabledText,
        isOutOfMonth && styles.outOfMonthText,
      ]}>
        {date.day}
      </Text>
      
      {hasEvents && (
        <View style={styles.miniTasksContainer}>
          {events.slice(0, isWeekView ? 3 : 2).map((event) => (
            <MiniTaskCard
              key={event.id}
              task={event}
              onPress={onTaskPress}
            />
          ))}
          {events.length > (isWeekView ? 3 : 2) && (
            <Text style={styles.moreTasksText}>
              +{events.length - (isWeekView ? 3 : 2)} more
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

// WeekView component
const WeekView = ({ selectedDate, onDateSelect, onTaskPress }) => {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start from Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <View style={styles.weekContainer}>
      {weekDays.map((date) => {
        const isToday = isSameDay(date, today);
        const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
        const dayEvents = MAINTENANCE_EVENTS.filter(event => event.date === format(date, 'yyyy-MM-dd'));

        return (
          <View key={date.toString()} style={styles.weekRow}>
            <TouchableOpacity
              style={[
                styles.weekDayHeader,
                isToday && styles.todayHeader,
                isSelected && styles.selectedHeader,
              ]}
              onPress={() => onDateSelect(date)}
            >
              <Text style={[styles.weekDayText, isToday && styles.todayText]}>
                {format(date, 'EEE')}
              </Text>
              <Text style={[styles.weekDateText, isToday && styles.todayText]}>
                {format(date, 'd')}
              </Text>
            </TouchableOpacity>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.eventsScroll}
            >
              {dayEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.weekEventCard}
                  onPress={() => onTaskPress(event)}
                >
                  <View style={styles.weekEventHeader}>
                    <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[event.category] }]} />
                    <Text style={styles.weekEventTitle} numberOfLines={1}>
                      {event.title}
                    </Text>
                  </View>
                  <View style={styles.weekEventMeta}>
                    <View style={styles.propertyRow}>
                      <Ionicons name="business-outline" size={12} color="#666" />
                      <Text style={styles.propertyText} numberOfLines={1}>{event.property}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: PRIORITY_COLORS[event.priority] }]}>
                      <Text style={styles.statusText}>{event.priority}</Text>
                    </View>
                  </View>
                  <Text style={styles.weekEventDescription} numberOfLines={2}>
                    {event.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );
      })}
    </View>
  );
};

const TaskDetailsModal = ({ visible, onClose, tasks, selectedDate }) => {
  if (!tasks || tasks.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            {tasks.map((task) => (
              <View key={task.id} style={styles.modalTaskCard}>
                <View style={styles.modalTaskHeader}>
                  <View style={[styles.modalCategoryDot, { backgroundColor: CATEGORY_COLORS[task.category] }]} />
                  <Text style={styles.modalTaskTitle}>{task.title}</Text>
                </View>
                <View style={styles.modalTaskDetails}>
                  <View style={styles.modalTaskRow}>
                    <Ionicons name="business-outline" size={16} color="#666" />
                    <Text style={styles.modalTaskText}>{task.property}</Text>
                  </View>
                  <View style={styles.modalTaskRow}>
                    <Ionicons name="list-outline" size={16} color="#666" />
                    <Text style={styles.modalTaskText}>{task.category}</Text>
                  </View>
                  <View style={styles.modalTaskRow}>
                    <Ionicons name="alert-circle-outline" size={16} color="#666" />
                    <Text style={[styles.modalTaskText, { color: PRIORITY_COLORS[task.priority] }]}>
                      {task.priority}
                    </Text>
                  </View>
                </View>
                <Text style={styles.modalTaskDescription}>{task.description}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default function UpkeepScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewMode, setViewMode] = useState('month');

  // Get events for a specific date
  const getEventsForDate = (date) => {
    return MAINTENANCE_EVENTS.filter(event => event.date === date);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Maintenance Calendar</Text>
        <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
      </View>

      <View style={styles.calendarWrapper}>
        {viewMode === 'month' ? (
          <Calendar
            current={selectedDate}
            onDayPress={(day) => {
              setSelectedDate(day.dateString);
              const events = getEventsForDate(day.dateString);
              if (events.length > 0) {
                setModalDate(day.dateString);
                setShowModal(true);
              }
            }}
            theme={{
              todayTextColor: '#007AFF',
              selectedDayBackgroundColor: '#007AFF',
              selectedDayTextColor: '#fff',
              dayTextColor: '#2d4150',
              textDisabledColor: '#d9e1e8',
              dotColor: '#007AFF',
              arrowColor: '#007AFF',
              monthTextColor: '#2d4150',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 14,
              'stylesheet.calendar.main': {
                container: {
                  paddingLeft: 0,
                  paddingRight: 0,
                },
                dayContainer: {
                  borderWidth: 0,
                  width: dayWidth,
                  height: dayHeight,
                },
                week: {
                  marginTop: 0,
                  marginBottom: 0,
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  paddingHorizontal: 0,
                },
              },
            }}
            style={styles.calendar}
            dayComponent={({ date, state }) => (
              <DayCell
                date={date}
                state={state}
                events={getEventsForDate(date.dateString)}
                onDayPress={(date) => setSelectedDate(date.dateString)}
                onTaskPress={(task) => {
                  setSelectedTask(task);
                  setShowModal(true);
                }}
              />
            )}
            horizontal={true}
            pagingEnabled={true}
            enableSwipeMonths={true}
          />
        ) : (
          <WeekView
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              setSelectedDate(format(date, 'yyyy-MM-dd'));
              setModalDate(format(date, 'yyyy-MM-dd'));
              setShowModal(true);
            }}
            onTaskPress={(task) => {
              setSelectedTask(task);
              setShowModal(true);
            }}
          />
        )}
      </View>

      <TaskDetailsModal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedTask(null);
        }}
        tasks={selectedTask ? [selectedTask] : getEventsForDate(modalDate)}
        selectedDate={selectedDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
  },
  calendarWrapper: {
    flex: 1,
    paddingHorizontal: 20,
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
    width: screenWidth - 40,
  },
  dayCell: {
    height: dayHeight,
    width: dayWidth,
    padding: 4,
    borderWidth: 1,
    borderColor: '#EDEDED',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  todayCell: {
    backgroundColor: '#F0F8FF',
  },
  selectedCell: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  disabledCell: {
    backgroundColor: '#F8F9FA',
  },
  outOfMonthCell: {
    backgroundColor: '#F8F9FA',
  },
  dayNumber: {
    fontSize: 14,
    color: '#2d4150',
    textAlign: 'left',
    marginBottom: 4,
    fontWeight: '500',
    paddingLeft: 4,
  },
  todayText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  selectedText: {
    color: '#007AFF',
  },
  disabledText: {
    color: '#d9e1e8',
  },
  outOfMonthText: {
    color: '#d9e1e8',
  },
  miniTasksContainer: {
    flex: 1,
    gap: 2,
  },
  miniCard: {
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 4,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  miniCardContent: {
    gap: 2,
  },
  miniCardTitle: {
    fontSize: 10,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 1,
  },
  miniCardTags: {
    flexDirection: 'row',
    gap: 2,
    flexWrap: 'wrap',
  },
  miniTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
    gap: 2,
  },
  miniTagDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  miniTagText: {
    fontSize: 8,
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  propertyText: {
    fontSize: 12,
    color: '#666',
  },
  moreTasksText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollContent: {
    paddingVertical: 16,
    gap: 16,
  },
  modalTaskCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: 300,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modalTaskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  modalCategoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalTaskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  modalTaskDetails: {
    gap: 8,
    marginBottom: 12,
  },
  modalTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTaskText: {
    fontSize: 14,
    color: '#4B5563',
  },
  modalTaskDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 2,
    marginTop: 12,
    width: 200,
    alignSelf: 'center',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#007AFF',
  },
  weekContainer: {
    backgroundColor: 'white',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 0,
    height: CALENDAR_HEIGHT,
    width: SCREEN_WIDTH,
    marginHorizontal: -16,
  },
  weekRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    height: (CALENDAR_HEIGHT - 7) / 7,
  },
  weekDayHeader: {
    width: 45,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayHeader: {
    backgroundColor: '#EFF6FF',
  },
  selectedHeader: {
    backgroundColor: '#DBEAFE',
  },
  weekDayText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 1,
  },
  weekDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  todayText: {
    color: '#2563EB',
  },
  eventsScroll: {
    flexGrow: 1,
    padding: 4,
    gap: 4,
    height: '100%',
  },
  weekEventCard: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 8,
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    maxHeight: ((CALENDAR_HEIGHT - 7) / 7) - 12,
  },
  weekEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  weekEventTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  weekEventMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
  },
  weekEventDescription: {
    fontSize: 10,
    color: '#6B7280',
    lineHeight: 12,
    maxHeight: 24,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
}); 