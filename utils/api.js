import axios from 'axios';

const url = 'https://abisoivc.pythonanywhere.com/send_email';

export const sendOTP = async (email, otp) => {
  const params = new URLSearchParams();
  params.append('to', email)
  params.append('subject', 'OTP Verification');
  params.append('html_body', `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h1 style="background-color: #4CAF50; color: white; padding: 10px;">OTP Verification</h1>
      <p style="font-size: 16px;">Your OTP is:</p>
      <p style="font-size: 24px; font-weight: bold; background-color: #f0f0f0; padding: 10px; display: inline-block;">${otp}</p>
      <p style="font-size: 14px; margin-top: 20px;">Please use this OTP to complete your verification process. If you did not request this, please ignore this email.</p>
      <p style="font-size: 14px; margin-top: 20px;">Thank you,</p>
      <p style="font-size: 14px; font-weight: bold;">Abiso IVC</p>
    </div>
  `);

  try {
    const response = await axios.get(`${url}?${params.toString()}`);
    console.log(response.data)
    return response.data;
  } catch (error) {
    console.error('Error sending otp try again later!', error);
    throw error;
  }
};

export const directions = async (from, to) => {
  try {
    const response = await axios.get(`https://api.mapbox.com/directions/v5/mapbox/driving/${from};${to}?geometries=geojson&access_token=pk.eyJ1IjoiYWJpc29pdmMiLCJhIjoiY2x5eDh0Z2k0MDcwNTJrcHN0aXl1anA2MiJ9.S94O4y8MKnzyyH7dS_thFw`);
    console.log(response.data)
    return response.data;
  } catch (error) {
    console.error('Error getting directions try again later!', error);
    throw error;
  }
}

export const reverseGeocode = async (longitude, latitude) => {
  try {
    const response = await axios.get(`https://api.mapbox.com/search/geocode/v6/reverse?longitude=${longitude}&latitude=${latitude}&access_token=pk.eyJ1IjoiYWJpc29pdmMiLCJhIjoiY2x5eDh0Z2k0MDcwNTJrcHN0aXl1anA2MiJ9.S94O4y8MKnzyyH7dS_thFw`);
    console.log(response.data)
    return response.data;
  } catch (error) {
    console.error('Error getting directions try again later!', error);
    throw error;
  }
}