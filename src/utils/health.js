// Health calculations
export const calculateBMR = (gender, weight, height, age) => {
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'male' ? bmr + 5 : bmr - 161;
};

export const calculateBMI = (weight, height) => {
  const h = height / 100;
  return (weight / (h * h)).toFixed(1);
};