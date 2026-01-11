// app/onboarding.tsx
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewToken
} from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    SharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useLanguage } from '../src/context/LanguageContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    image: require('../assets/images/boardingscreen1.jpeg'),
  },
  {
    id: 2,
    image: require('../assets/images/boardingscreen2.jpeg'),
  },
  {
    id: 3,
    image: require('../assets/images/boardingscreen3.jpeg'),
  },
  {
    id: 4,
    image: null, // Final slide without image
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: SCREEN_WIDTH * (currentIndex + 1),
        animated: true,
      });
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/');
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'id' ? 'en' : 'id');
  };

  const getSlideContent = (index: number) => {
    switch (index) {
      case 0:
        return {
          title: t.onboardingTitle1,
          description: t.onboardingDesc1,
        };
      case 1:
        return {
          title: t.onboardingTitle2,
          description: t.onboardingDesc2,
        };
      case 2:
        return {
          title: t.onboardingTitle3,
          description: t.onboardingDesc3,
        };
      case 3:
        return {
          title: t.onboardingTitle4,
          description: t.onboardingDesc4,
        };
      default:
        return { title: '', description: '' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradients */}
      <View style={styles.gradientTopLeft} />
      <View style={styles.gradientBottomRight} />

      {/* Language Toggle - Top Right */}
      <TouchableOpacity 
        style={styles.languageToggle} 
        onPress={toggleLanguage}
        activeOpacity={0.8}
      >
        <MaterialIcons name="language" size={20} color="#A78BFA" />
        <Text style={styles.languageText}>{language.toUpperCase()}</Text>
      </TouchableOpacity>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill,
              {
                width: `${((currentIndex + 1) / slides.length) * 100}%`,
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(((currentIndex + 1) / slides.length) * 100)}%
        </Text>
      </View>

      {/* Slides */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
      >
        {slides.map((slide, index) => (
          <SlideItem
            key={slide.id}
            slide={slide}
            index={index}
            scrollX={scrollX}
            content={getSlideContent(index)}
            isLastSlide={index === slides.length - 1}
            onGetStarted={handleGetStarted}
            onNotReady={handleSkip}
            t={t}
          />
        ))}
      </Animated.ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomContainer}>
        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => {
            const dotStyle = useAnimatedStyle(() => {
              const inputRange = [
                (index - 1) * SCREEN_WIDTH,
                index * SCREEN_WIDTH,
                (index + 1) * SCREEN_WIDTH,
              ];

              const width = interpolate(
                scrollX.value,
                inputRange,
                [8, 24, 8],
                Extrapolation.CLAMP
              );

              const opacity = interpolate(
                scrollX.value,
                inputRange,
                [0.3, 1, 0.3],
                Extrapolation.CLAMP
              );

              return {
                width: withSpring(width),
                opacity: withTiming(opacity),
              };
            });

            return (
              <Animated.View
                key={index}
                style={[styles.dot, dotStyle]}
              />
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {currentIndex < slides.length - 1 ? (
            <>
              <TouchableOpacity 
                style={styles.skipButton} 
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.skipText}>{t.skip}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.nextButton} 
                onPress={handleNext}
                activeOpacity={0.85}
              >
                <Text style={styles.nextText}>{t.next}</Text>
                <MaterialIcons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

interface SlideItemProps {
  slide: typeof slides[0];
  index: number;
  scrollX: SharedValue<number>;
  content: { title: string; description: string };
  isLastSlide: boolean;
  onGetStarted: () => void;
  onNotReady: () => void;
  t: any;
}

const SlideItem: React.FC<SlideItemProps> = ({
  slide,
  index,
  scrollX,
  content,
  isLastSlide,
  onGetStarted,
  onNotReady,
  t,
}) => {
  const imageAnimatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1, 0.8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale: withSpring(scale) }],
      opacity: withTiming(opacity),
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [50, 0, 50],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY: withSpring(translateY) }],
      opacity: withTiming(opacity),
    };
  });

  return (
    <View style={styles.slide}>
      {/* Image or Final Content */}
      {!isLastSlide && slide.image ? (
        <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
          <View style={styles.imageWrapper}>
            <Image 
              source={slide.image} 
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        </Animated.View>
      ) : (
        <View style={styles.finalSlideContainer}>
          <Animated.View style={[styles.checkIconContainer, imageAnimatedStyle]}>
            <View style={styles.checkIconCircle}>
              <MaterialIcons name="check-circle" size={120} color="#34D399" />
            </View>
          </Animated.View>
        </View>
      )}

      {/* Text Content */}
      <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.description}>{content.description}</Text>

        {/* Final Slide Buttons */}
        {isLastSlide && (
          <View style={styles.finalButtonsContainer}>
            <TouchableOpacity 
              style={styles.getStartedButton} 
              onPress={onGetStarted}
              activeOpacity={0.85}
            >
              <MaterialIcons name="rocket-launch" size={24} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.getStartedText}>{t.getStarted}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.notReadyButton} 
              onPress={onNotReady}
              activeOpacity={0.7}
            >
              <Text style={styles.notReadyText}>{t.notReady}</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0A1F',
  },
  gradientTopLeft: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    borderRadius: 200,
    zIndex: 0,
  },
  gradientBottomRight: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 350,
    height: 350,
    backgroundColor: 'rgba(244, 114, 182, 0.15)',
    borderRadius: 200,
    zIndex: 0,
  },
  languageToggle: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    zIndex: 10,
  },
  languageText: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  progressContainer: {
    position: 'absolute',
    top: 110,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#A78BFA',
    borderRadius: 2,
  },
  progressText: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 12,
    minWidth: 45,
    textAlign: 'right',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingTop: 140,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  imageWrapper: {
    width: SCREEN_WIDTH * 0.75,
    height: SCREEN_WIDTH * 0.75,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  finalSlideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  textContainer: {
    paddingHorizontal: 30,
    paddingVertical: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F9FAFB',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  finalButtonsContainer: {
    width: '100%',
    marginTop: 40,
    gap: 16,
  },
  getStartedButton: {
    flexDirection: 'row',
    backgroundColor: '#A78BFA',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  getStartedText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  notReadyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  notReadyText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A78BFA',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: '#A78BFA',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
