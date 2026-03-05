"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import { useRouter } from "next/navigation"; // use NextJS router for navigation
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Form, Input, Flex } from "antd";
// Optionally, you can import a CSS module or file for additional styling:
// import styles from "@/styles/page.module.css";

interface RegisterFormValues {
  username: string;
  name: string;
  password: string;
  bio: string;
}

const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  // useLocalStorage hook example use
  // The hook returns an object with the value and two functions
  // Simply choose what you need from the hook:
  const {
    // value: token, // is commented out because we do not need the token value
    set: setToken, // we need this method to set the value of the token to the one we receive from the POST request to the backend server API
    // clear: clearToken, // is commented out because we do not need to clear the token when logging in
  } = useLocalStorage<string>("token", ""); // note that the key we are selecting is "token" and the default value we are setting is an empty string
  // if you want to pick a different token, i.e "usertoken", the line above would look as follows: } = useLocalStorage<string>("usertoken", "");

  const handleLogin = async (values: RegisterFormValues) => {
    try {
      // Call the API service and let it handle JSON serialization and error handling
      const response = await apiService.post<User>("/users", values);

      // Use the useLocalStorage hook that returned a setter function (setToken in line 41) to store the token if available
      if (response.token) {
        setToken(response.token);
      }

      // Navigate to the user overview
      router.push(`/users/${response.id}`);
    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during the registration:\n${error.message}`);
      } else {
        console.error("An unknown error occurred during registration.");
      }
    }
  };

  return (
    <div className="login-container">
      <Form
        form={form}
        name="login"
        size="large"
        variant="outlined"
        onFinish={handleLogin}
        layout="vertical"
      >
        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: "Please input your username!" }]}
        >
          <Input placeholder="Enter username"/>
        </Form.Item>
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: "Please input your name!" }]}
        >
          <Input placeholder="Enter name"/>
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: "Enter password" }]}
        >
         <Input.Password placeholder="Enter your password"/>
        </Form.Item>
        <Form.Item
          name="password-confirm"
          label="Password Confirmation"
          dependencies={["password"]}
          rules={[
            {required: true, message: "Confirm your password"},
            ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Passwords do not match"));
            },
    }),

          ]}
        >
        <Input.Password placeholder="Confirm your password"/>
        </Form.Item>
        <Form.Item
          name="bio"
          label="Bio"
        >
          <Input.TextArea rows={3} placeholder="Tell us something about you!"/>
        </Form.Item>
        <Form.Item style={{marginTop:32}}>
          <Flex gap="middle">
            <Button type="primary" htmlType="submit" className="button-register">
              Register
            </Button>
            <Button type="primary" className="button-login" onClick={() => router.push("/")}>
              Already have an Account
            </Button>
          </Flex>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Login;
