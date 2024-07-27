import { View, StyleSheet } from 'react-native';
import { Onboarding } from 'react-native-app-onboard';
import LottieView from 'lottie-react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { storeData } from '../utils/asyncStorage'

export default function OnBoarding() {

    const navigation = useNavigation();
    const handleDone = () => {
      storeData('onboarded', 'true');
      navigation.navigate('Login' as never);
    }

  return (
    <>
    <StatusBar style="auto" />
      <Onboarding
        onSkip={handleDone}
        onDone={handleDone}
        showDone={true}
        showSkip={true}
        showPagination={true}
        pages={[
          {
            backgroundColor: '#1f1f1f', // Sky Blue
            image: (
              <View>
                <LottieView
                  autoPlay
                  style={{
                    width: 300,
                    height: 300,
                  }}
                  source={require('../assets/animations/alarm.json')}
                />
              </View>
            ),
            title: 'Realtime Alarm',
            subtitle: 'Realtime Alarm for Disaster in Barangay',
          },
          {
            backgroundColor: '#8a05ff', // Steel Blue
            image: (
              <View>
                <LottieView
                  autoPlay
                  style={{
                    width: 300,
                    height: 300,
                  }}
                  source={require('../assets/animations/notice.json')}
                />
              </View>
            ),
            title: 'Stay Informed',
            subtitle: 'Stay Informed with Real-Time Updates',
          },
          {
            backgroundColor: '#FF5733', // Cadet Blue
            image: (
              <View>
                <LottieView
                  autoPlay
                  style={{
                    width: 300,
                    height: 300,
                  }}
                  source={require('../assets/animations/safety.json')}
                />
              </View>
            ),
            title: 'Safety First',
            subtitle: 'Your Safety, Our Priority',
          },
        ]}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  dot: {
    height: 10,
    width: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    margin: 5,
  },
  activeDot: {
    backgroundColor: 'white',
    width: 30,
    height: 10,
  },
  inActiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 30,
    paddingHorizontal: 20,
    width: '100%',
  },
  button: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
