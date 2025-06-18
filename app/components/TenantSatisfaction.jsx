import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const { width } = Dimensions.get('window');

export default function TenantSatisfaction({ tenantId, propertyId }) {
  const [selectedRating, setSelectedRating] = useState(null);
  const [hasRatedToday, setHasRatedToday] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const [ratingId, setRatingId] = useState(null);
  const theme = useTheme();

  // Check if tenant has already rated today
  useEffect(() => {
    const checkTodaysRating = async () => {
      if (!tenantId || !propertyId) return;
      
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const { data, error } = await supabase
        .from('tenant_satisfaction')
        .select('id, score')
        .eq('tenant_id', tenantId)
        .eq('submitted_at', today)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking today\'s rating:', error);
        return;
      }
      
      if (data) {
        setSelectedRating(data.score);
        setRatingId(data.id);
        setHasRatedToday(true);
      }
    };
    
    checkTodaysRating();
  }, [tenantId, propertyId]);

  // Submit rating to Supabase
  const submitRating = async (score) => {
    if (!tenantId || !propertyId || isSubmitting) return;
    
    // If the same rating is clicked again, delete it
    if (selectedRating === score) {
      await deleteRating();
      return;
    }
    
    setIsSubmitting(true);
    
    const { data, error } = await supabase
      .from('tenant_satisfaction')
      .insert([
        { 
          tenant_id: tenantId,
          house_id: propertyId,
          score: score
        }
      ])
      .select('id');
    
    setIsSubmitting(false);
    
    if (error) {
      // If it's a unique constraint violation (already rated today), update the rating
      if (error.code === '23505') {
        updateRating(score);
      } else {
        console.error('Error submitting rating:', error);
      }
      return;
    }
    
    // Successfully submitted
    if (data && data[0]) {
      setRatingId(data[0].id);
    }
    setSelectedRating(score);
    setHasRatedToday(true);
    
    // Animate the confirmation
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.delay(3000), // Increased from 1500ms to 3000ms
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  };

  // Update an existing rating
  const updateRating = async (score) => {
    if (!tenantId || !ratingId) return;
    
    const { error } = await supabase
      .from('tenant_satisfaction')
      .update({ score: score })
      .eq('tenant_id', tenantId)
      .eq('id', ratingId);
    
    if (error) {
      console.error('Error updating rating:', error);
      return;
    }
    
    setSelectedRating(score);
    
    // Animate the confirmation
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.delay(3000), // Increased from 1500ms to 3000ms
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  };

  // Delete a rating
  const deleteRating = async () => {
    if (!tenantId || isSubmitting) return;
    
    setIsSubmitting(true);
    
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('tenant_satisfaction')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('submitted_at', today);
    
    setIsSubmitting(false);
    
    if (error) {
      console.error('Error deleting rating:', error);
      return;
    }
    
    // Successfully deleted
    setSelectedRating(null);
    setRatingId(null);
    setHasRatedToday(false);
    
    // Animate the confirmation
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.delay(3000), // Increased from 1500ms to 3000ms
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  };

  // Rating options with emojis, colors and labels - airport kiosk style
  const ratingOptions = [
    { 
      score: 1, 
      icon: 'sad', 
      color: '#E53935', 
      label: 'Yikes!',
      background: '#FFEBEE'
    },
    { 
      score: 2, 
      icon: 'sad-outline', 
      color: '#FB8C00', 
      label: 'Meh',
      background: '#FFF3E0'
    },
    { 
      score: 3, 
      icon: 'remove-outline', 
      color: '#FDD835', 
      label: 'Okay',
      background: '#FFFDE7'
    },
    { 
      score: 4, 
      icon: 'happy-outline', 
      color: '#43A047', 
      label: 'Good',
      background: '#E8F5E9'
    },
    { 
      score: 5, 
      icon: 'heart', 
      color: '#1E88E5', 
      label: 'Love',
      background: '#E3F2FD'
    }
  ];
  
  // Animation styles for confirmation message
  const confirmationOpacity = animation;
  const confirmationTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0]
  });

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerContainer}>
        <Ionicons name="home" size={24} color="#6C5CE7" style={styles.headerIcon} />
        <ThemedText type="subtitle" style={styles.title}>
          How's your Dwello home today?
        </ThemedText>
      </View>
      
      <ThemedText type="default" style={styles.subtitle}>
        {hasRatedToday 
          ? 'Thanks for sharing your home experience!' 
          : 'Tap to let Mark know how you feel'}
      </ThemedText>
      
      <View style={styles.ratingsContainer}>
        {ratingOptions.map((option) => (
          <TouchableOpacity
            key={option.score}
            style={[
              styles.ratingButton,
              selectedRating === option.score && { backgroundColor: option.color },
              { backgroundColor: selectedRating === option.score ? option.color : option.background }
            ]}
            onPress={() => submitRating(option.score)}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={option.icon} 
              size={28} 
              color={selectedRating === option.score ? '#FFFFFF' : option.color} 
              style={styles.ratingIcon}
            />
            <View style={styles.labelContainer}>
              <ThemedText 
                type="default" 
                style={[
                  styles.ratingLabel, 
                  { color: selectedRating === option.score ? '#FFFFFF' : option.color }
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {option.label}
              </ThemedText>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      {selectedRating !== null && (
        <View style={styles.hintContainer}>
          <ThemedText type="default" style={styles.hintText}>
            Tap again to change or remove your rating
          </ThemedText>
        </View>
      )}
      
      <Animated.View 
        style={[
          styles.confirmationContainer,
          { 
            opacity: confirmationOpacity,
            transform: [{ translateY: confirmationTranslateY }]
          }
        ]}
      >
        <ThemedText type="default" style={styles.confirmationText}>
          {selectedRating === null ? "Rating removed!" : "Thanks for your rating!"}
        </ThemedText>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.7,
  },
  ratingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 0,
  },
  ratingButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: (width - 160) / 5,
    height: (width - 120) / 5,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 6,
  },
  ratingIcon: {
    marginBottom: 4,
  },
  labelContainer: {
    width: '100%',
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 1,
  },
  hintContainer: {
    marginTop: 16,
    opacity: 0.7,
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  thankyouContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
  },
  thankyouIcon: {
    marginRight: 8,
  },
  thankyouText: {
    fontSize: 14,
    color: '#43A047',
    fontWeight: '500',
  },
  confirmationContainer: {
    position: 'absolute',
    bottom: -40,
    backgroundColor: '#6C5CE7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmationText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 