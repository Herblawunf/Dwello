import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, ScrollView, Dimensions, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, addDays, addWeeks, subWeeks, parseISO } from "date-fns";

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 49; // Standard tab bar height
const TOP_BAR_HEIGHT = 60; // Approximate top bar height
const BOTTOM_PADDING = 100; // Increased bottom padding
const CALENDAR_HEIGHT = SCREEN_HEIGHT - TAB_BAR_HEIGHT - TOP_BAR_HEIGHT - BOTTOM_PADDING;

// Category colors
const CATEGORY_COLORS = {
  'HVAC': '#FF4444',
  'Plumbing': '#4573D2', // Notion blue
  'Electrical': '#E8912D', // Notion orange
  'Landscaping': '#2D8B5F', // Notion green
  'General': '#6B7280',
};

// Priority colors
const PRIORITY_COLORS = {
  'Urgent': '#E03131', // Notion red
  'Routine': '#E8912D', // Notion orange
  'Minor': '#2D8B5F', // Notion green
};

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

// MiniTaskCard component for in-cell task display with improved visibility
const MiniTaskCard = ({ task, onPress, style }) => {
  const priorityColor = PRIORITY_COLORS[task.priority] || '#6B7280';
  const categoryColor = CATEGORY_COLORS[task.category] || '#6B7280';
  
  return (
    <TouchableOpacity
      onPress={() => onPress(task)}
      style={[styles.miniCard, style]}
    >
      <Text style={styles.miniCardTitle} numberOfLines={1}>
        {task.title}
      </Text>
      <View style={styles.miniCardMeta}>
        <View style={[styles.miniCategoryTag, { backgroundColor: `${categoryColor}15` }]}>
          <View style={[styles.miniCategoryDot, { backgroundColor: categoryColor }]} />
          <Text style={styles.miniCategoryText} numberOfLines={1}>{task.category}</Text>
        </View>
        <View style={[styles.miniPriorityTag, { backgroundColor: `${priorityColor}15` }]}>
          <Text style={[styles.miniPriorityText, { color: priorityColor }]}>{task.priority}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// DayCell component for month view
const DayCell = ({ date, isCurrentMonth, isToday, isSelected, events, onDayPress, onTaskPress }) => {
  const hasEvents = events && events.length > 0;
  const displayEvents = events?.slice(0, 2) || [];
  const remainingCount = events?.length > 2 ? events.length - 2 : 0;

  return (
    <TouchableOpacity
      style={[
        styles.dayCell,
        !isCurrentMonth && styles.outOfMonthCell,
        isToday && styles.todayCell,
        isSelected && styles.selectedCell,
      ]}
      onPress={() => onDayPress(date)}
    >
      <Text style={[
        styles.dayNumber,
        !isCurrentMonth && styles.outOfMonthText,
        isToday && styles.todayText,
        isSelected && styles.selectedText,
      ]}>
        {format(date, 'd')}
      </Text>
      
      {hasEvents && (
        <View style={styles.miniTasksContainer}>
          {displayEvents.map((event) => (
            <MiniTaskCard
              key={event.id}
              task={event}
              onPress={() => onTaskPress(event)}
            />
          ))}
          {remainingCount > 0 && (
            <Text style={styles.moreTasksText}>
              + {remainingCount} more
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

// Month Grid component
const MonthView = ({ selectedDate, onDateSelect, onTaskPress, events }) => {
  const currentDate = selectedDate ? parseISO(selectedDate) : new Date();
  
  // Generate days for the current month view
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Group days into weeks
  const weeks = useMemo(() => {
    const result = [];
    let week = [];
    
    monthDays.forEach((day, i) => {
      week.push(day);
      if (week.length === 7 || i === monthDays.length - 1) {
        result.push(week);
        week = [];
      }
    });
    
    return result;
  }, [monthDays]);

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return events.filter(event => event.date === dateString);
  };

  return (
    <View style={styles.monthContainer}>
      <View style={styles.weekdayHeader}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <Text key={day} style={styles.weekdayText}>{day}</Text>
        ))}
      </View>
      
      <View style={styles.monthGrid}>
        {weeks.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.weekRow}>
            {week.map((day) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, parseISO(selectedDate));
              const dayEvents = getEventsForDate(day);
              
              return (
                <DayCell
                  key={day.toString()}
                  date={day}
                  isCurrentMonth={isCurrentMonth}
                  isToday={isToday}
                  isSelected={isSelected}
                  events={dayEvents}
                  onDayPress={(date) => onDateSelect(format(date, 'yyyy-MM-dd'))}
                  onTaskPress={onTaskPress}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

// Week Day component for week view
const WeekDayColumn = ({ date, isToday, isSelected, events, onDateSelect, onTaskPress }) => {
  const dayEvents = events || [];
  const displayEvents = dayEvents.slice(0, 3);
  const remainingCount = dayEvents.length > 3 ? dayEvents.length - 3 : 0;

  return (
    <View style={styles.weekDayColumn}>
      <TouchableOpacity 
        style={[
          styles.weekDayHeader,
          isToday && styles.todayHeader,
          isSelected && styles.selectedHeader,
        ]}
        onPress={() => onDateSelect(format(date, 'yyyy-MM-dd'))}
      >
        <Text style={[styles.weekDayText, isToday && styles.todayText]}>
          {format(date, 'EEE')}
        </Text>
        <Text style={[styles.weekDateText, isToday && styles.todayText]}>
          {format(date, 'd')}
        </Text>
      </TouchableOpacity>

      <View style={styles.weekDayContent}>
        {displayEvents.length > 0 ? (
          displayEvents.map((event) => (
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
                <View style={[styles.priorityPill, { backgroundColor: `${PRIORITY_COLORS[event.priority]}15`, borderColor: `${PRIORITY_COLORS[event.priority]}30` }]}>
                  <Text style={[styles.priorityText, { color: PRIORITY_COLORS[event.priority] }]}>{event.priority}</Text>
                </View>
              </View>
              <View style={styles.propertyRow}>
                <Ionicons name="business-outline" size={12} color="#666" />
                <Text style={styles.propertyText} numberOfLines={1}>{event.property}</Text>
              </View>
              <Text style={styles.weekEventDescription} numberOfLines={2}>
                {event.description}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyDayContent}>
            <Text style={styles.emptyDayText}>No tasks</Text>
          </View>
        )}
        
        {remainingCount > 0 && (
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => onDateSelect(format(date, 'yyyy-MM-dd'))}
          >
            <Text style={styles.viewAllText}>View all tasks ({dayEvents.length})</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Week View component - Horizontal layout (days on Y-axis, time on X-axis)
const WeekView = ({ selectedDate, onDateSelect, onTaskPress, events }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const date = selectedDate ? parseISO(selectedDate) : new Date();
    return startOfWeek(date, { weekStartsOn: 0 });
  });
  
  // Generate days for the current week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  // Navigate to previous/next week
  const goToPreviousWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return events.filter(event => event.date === dateString);
  };

  return (
    <View style={styles.weekViewContainer}>
      <View style={styles.weekNavigation}>
        <TouchableOpacity onPress={goToPreviousWeek} style={styles.navButton}>
          <Ionicons name="chevron-back" size={20} color="#666" />
        </TouchableOpacity>
        <Text style={styles.weekRangeText}>
          {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
        </Text>
        <TouchableOpacity onPress={goToNextWeek} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.weekScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.weekScrollContent}
      >
        {weekDays.map((day) => {
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate && isSameDay(day, parseISO(selectedDate));
          const dayEvents = getEventsForDate(day);
          
          return (
            <View key={day.toString()} style={styles.weekDayRow}>
              <TouchableOpacity 
                style={[
                  styles.weekDayLabel,
                  isToday && styles.todayLabel,
                  isSelected && styles.selectedLabel,
                ]}
                onPress={() => onDateSelect(format(day, 'yyyy-MM-dd'))}
              >
                <Text style={[styles.weekDayLabelText, isToday && styles.todayText]}>
                  {format(day, 'EEE')}
                </Text>
                <Text style={[styles.weekDayLabelDate, isToday && styles.todayText]}>
                  {format(day, 'd')}
                </Text>
              </TouchableOpacity>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.weekDayEventsContainer}
              >
                {dayEvents.length > 0 ? (
                  dayEvents.map((event) => (
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
                      <View style={styles.eventTagsRow}>
                        <View style={[styles.categoryTag, { backgroundColor: `${CATEGORY_COLORS[event.category]}15` }]}>
                          <Text style={[styles.categoryTagText, { color: CATEGORY_COLORS[event.category] }]}>
                            {event.category}
                          </Text>
                        </View>
                        <View style={[styles.priorityTag, { backgroundColor: `${PRIORITY_COLORS[event.priority]}15` }]}>
                          <Text style={[styles.priorityTagText, { color: PRIORITY_COLORS[event.priority] }]}>
                            {event.priority}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.propertyRow}>
                        <Ionicons name="business-outline" size={12} color="#666" />
                        <Text style={styles.propertyText} numberOfLines={1}>{event.property}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyDaySlot}>
                    <Text style={styles.emptyDayText}>No tasks scheduled</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          );
        })}
        {/* Extra padding is added via contentContainerStyle */}
      </ScrollView>
    </View>
  );
};

// Task Details Modal component
const TaskDetailsModal = ({ visible, onClose, task, date }) => {
  if (!task) return null;

  const priorityColor = PRIORITY_COLORS[task.priority] || '#6B7280';
  const categoryColor = CATEGORY_COLORS[task.category] || '#6B7280';

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
              {task.title}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Date</Text>
              <Text style={styles.sectionText}>
                {format(parseISO(task.date), 'EEEE, MMMM d, yyyy')}
              </Text>
            </View>
            
            <View style={styles.tagsRow}>
              <View style={[styles.tagPill, { backgroundColor: `${categoryColor}15`, borderColor: `${categoryColor}30` }]}>
                <View style={[styles.tagDot, { backgroundColor: categoryColor }]} />
                <Text style={[styles.tagText, { color: categoryColor }]}>{task.category}</Text>
              </View>
              
              <View style={[styles.tagPill, { backgroundColor: `${priorityColor}15`, borderColor: `${priorityColor}30` }]}>
                <Text style={[styles.tagText, { color: priorityColor }]}>{task.priority}</Text>
              </View>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Property</Text>
              <View style={styles.propertyRowLarge}>
                <Ionicons name="business-outline" size={16} color="#666" />
                <Text style={styles.propertyTextLarge}>{task.property}</Text>
              </View>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{task.description}</Text>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="create-outline" size={20} color="#FFF" />
              <Text style={styles.editButtonText}>Edit Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Main NotionCalendar component
const NotionCalendar = ({ events }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('month');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleTaskPress = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleDateSelect = (dateString) => {
    setSelectedDate(dateString);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Maintenance Calendar</Text>
        <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
      </View>

      <View style={styles.calendarWrapper}>
        {viewMode === 'month' ? (
          <MonthView
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onTaskPress={handleTaskPress}
            events={events}
          />
        ) : (
          <WeekView
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onTaskPress={handleTaskPress}
            events={events}
          />
        )}
      </View>

      <TaskDetailsModal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        date={selectedDate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },
  calendarWrapper: {
    flex: 1,
  },
  // View Toggle Styles
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 2,
    marginTop: 8,
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
    color: '#000',
    fontWeight: '600',
  },
  
  // Month View Styles
  monthContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  monthGrid: {
    flex: 1,
  },
  weekRow: {
    flexDirection: 'row',
    height: CALENDAR_HEIGHT / 6, // Divide available height by 6 rows
  },
  dayCell: {
    flex: 1,
    margin: 2,
    padding: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  todayCell: {
    backgroundColor: '#F9FAFB',
  },
  selectedCell: {
    borderColor: '#4573D2',
    borderWidth: 2,
  },
  outOfMonthCell: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  dayNumber: {
    fontSize: 14,
    color: '#2d4150',
    fontWeight: '500',
    marginBottom: 4,
    paddingLeft: 2,
  },
  todayText: {
    color: '#4573D2',
    fontWeight: '600',
  },
  selectedText: {
    color: '#4573D2',
  },
  outOfMonthText: {
    color: '#9CA3AF',
  },
  miniTasksContainer: {
    flex: 1,
    gap: 2,
  },
  miniCard: {
    backgroundColor: 'white',
    borderRadius: 4,
    padding: 6,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  miniCardTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  miniCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 3,
  },
  miniCategoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    maxWidth: '60%',
  },
  miniCategoryDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 3,
  },
  miniCategoryText: {
    fontSize: 8,
    color: '#4B5563',
    fontWeight: '500',
  },
  miniPriorityTag: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  miniPriorityText: {
    fontSize: 8,
    fontWeight: '500',
  },
  moreTasksText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
  
  // Week View Styles
  weekViewContainer: {
    flex: 1,
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  navButton: {
    padding: 8,
  },
  weekRangeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  weekScrollView: {
    flex: 1,
  },
  weekScrollContent: {
    paddingBottom: 100, // Add extra padding at the bottom
  },
  weekDayRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 12,
    minHeight: 100, // Ensure consistent height for each day row
  },
  weekDayLabel: {
    width: 60,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F0F0F0',
  },
  weekDayLabelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  weekDayLabelDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  todayLabel: {
    backgroundColor: '#F0F7FF',
  },
  selectedLabel: {
    backgroundColor: '#E6F0FF',
    borderRightColor: '#4573D2',
    borderRightWidth: 2,
  },
  weekDayEventsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 10,
    alignItems: 'center',
  },
  weekEventCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    width: 220,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  weekEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  weekEventTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 6,
  },
  eventTagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  categoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  priorityTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityTagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  propertyText: {
    fontSize: 12,
    color: '#6B7280',
  },
  weekEventDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#4573D2',
    fontWeight: '500',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  modalSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 16,
    color: '#111827',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  propertyRowLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  propertyTextLarge: {
    fontSize: 16,
    color: '#111827',
  },
  descriptionText: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 24,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  editButton: {
    backgroundColor: '#4573D2',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyDaySlot: {
    width: 220,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  emptyDayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyDayText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  // Removed redundant weekBottomPadding style
});

export default NotionCalendar; 