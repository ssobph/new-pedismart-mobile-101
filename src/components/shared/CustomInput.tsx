import React from "react";
import { View, TextInput, StyleSheet, TextInputProps } from "react-native";
import { Colors } from "@/utils/Constants";
import CustomText from "./CustomText";

interface CustomInputProps extends TextInputProps {
  label: string;
  error?: string;
}

const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      <CustomText fontFamily="Medium" fontSize={12} style={styles.label}>
        {label}
      </CustomText>
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor="#999"
        {...props}
      />
      {error && (
        <CustomText fontFamily="Regular" fontSize={10} style={styles.errorText}>
          {error}
        </CustomText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    color: "#333",
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F5F5F5",
    color: "#333",
    fontFamily: "Regular",
    fontSize: 14,
  },
  inputError: {
    borderWidth: 1,
    borderColor: "red",
  },
  errorText: {
    color: "red",
    marginTop: 4,
  },
});

export default CustomInput;
