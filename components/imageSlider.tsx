import React, { useRef, useEffect } from 'react';
import { View, Image, Dimensions, FlatList, Text } from 'react-native';

const ImageSlider = ({ images }: any) => {
  const flatListRef = useRef<FlatList<any> | null>(null);
  const { width } = Dimensions.get('window');
  const height = width * 1;
  let currentIndex = 0;

  const renderItem = ({ item }: any) => (
    <View style={{width: 300, height: 300} }>
      <Image
        source={{ uri: item.uri }}
        style={{ width: 300, height: 250, resizeMode: 'contain' }}
      />
      <Text className='font-bold text-xs' style={{textAlign: "center"}}>{item.text}</Text>
    </View>
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (flatListRef.current) {
        currentIndex += 1;
        if (currentIndex >= images.length) {
          clearInterval(intervalId);
        } else {
          flatListRef.current.scrollToIndex({
            index: currentIndex,
            animated: true,
          });
        }
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [images]);


  return (
    <View style={{ width: 300, height: 320 }}>
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default ImageSlider;
