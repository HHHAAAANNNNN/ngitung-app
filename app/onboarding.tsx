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
import { useTheme } from '../src/context/ThemeContext';

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
  const { mode, toggleTheme, colors } = useTheme();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background Gradients */}
      <View style={[styles.gradientTopLeft, { backgroundColor: mode === 'dark' ? 'rgba(167, 139, 250, 0.15)' : 'rgba(139, 92, 246, 0.1)' }]} />
      <View style={[styles.gradientBottomRight, { backgroundColor: mode === 'dark' ? 'rgba(244, 114, 182, 0.15)' : 'rgba(236, 72, 153, 0.1)' }]} />

      {/* Theme Toggle - Top Right */}
      <TouchableOpacity 
        style={[styles.themeToggle, { backgroundColor: mode === 'dark' ? 'rgba(167, 139, 250, 0.15)' : 'rgba(139, 92, 246, 0.15)', borderColor: mode === 'dark' ? 'rgba(167, 139, 250, 0.3)' : 'rgba(139, 92, 246, 0.3)' }]} 
        onPress={toggleTheme}
        activeOpacity={0.8}
      >
        <MaterialIcons name={mode === 'dark' ? 'light-mode' : 'dark-mode'} size={24} color={colors.primary} />
      </TouchableOpacity>

      {/* Language Toggle - Top Right */}
      <TouchableOpacity 
        style={[styles.languageToggle, { backgroundColor: mode === 'dark' ? 'rgba(167, 139, 250, 0.15)' : 'rgba(139, 92, 246, 0.15)', borderColor: mode === 'dark' ? 'rgba(167, 139, 250, 0.3)' : 'rgba(139, 92, 246, 0.3)' }]} 
        onPress={toggleLanguage}
        activeOpacity={0.8}
      >
        <MaterialIcons name="language" size={20} color={colors.primary} />
        <Text style={[styles.languageText, { color: colors.primary }]}>{language.toUpperCase()}</Text>
      </TouchableOpacity>

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
            colors={colors}
            mode={mode}
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
                style={[styles.dot, dotStyle, { backgroundColor: colors.primary }]}
              />
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {currentIndex < slides.length - 1 && (
            <>
              <TouchableOpacity 
                style={styles.skipButton} 
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Text style={[styles.skipText, { color: colors.textSecondary }]}>{t.skip}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.nextButton, { backgroundColor: colors.primary }]} 
                onPress={handleNext}
                activeOpacity={0.85}
              >
                <Text style={styles.nextText}>{t.next}</Text>
                <MaterialIcons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            </>
          )}
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
  colors: any;
  mode: string;
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
  colors,
  mode,
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
          <View style={[styles.imageWrapper, { 
            backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            borderColor: mode === 'dark' ? 'rgba(167, 139, 250, 0.3)' : 'rgba(99, 102, 241, 0.3)',
            shadowColor: colors.primary
          }]}>
            <Image 
              source={slide.image} 
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        </Animated.View>
      ) : (
        <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
          <View style={[styles.checkIconCircle, { backgroundColor: mode === 'dark' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.15)', borderColor: mode === 'dark' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(16, 185, 129, 0.3)' }]}>
            <MaterialIcons name="check-circle" size={120} color={colors.secondary} />
          </View>
        </Animated.View>
      )}

      {/* Text Content */}
      <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
        <Text style={[styles.title, { color: colors.text }]}>{content.title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{content.description}</Text>

        {/* Final Slide Buttons */}
        {isLastSlide && (
          <View style={styles.finalButtonsContainer}>
            <TouchableOpacity 
              style={[styles.getStartedButton, { backgroundColor: colors.primary }]} 
              onPress={onGetStarted}
              activeOpacity={0.85}
            >
              <MaterialIcons name="rocket-launch" size={24} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.getStartedText}>{t.getStarted}</Text>
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
  },
  gradientTopLeft: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 200,
    zIndex: 0,
  },
  gradientBottomRight: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 350,
    height: 350,
    borderRadius: 200,
    zIndex: 0,
  },
  languageToggle: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 10,
  },
  themeToggle: {
    position: 'absolute',
    top: 50,
    right: 90,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 10,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingTop: 100,
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
    borderWidth: 2,
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  textContainer: {
    paddingHorizontal: 30,
    paddingVertical: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  finalButtonsContainer: {
    width: '100%',
    marginTop: 0,
  },
  getStartedButton: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  notReadyText: {
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
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
