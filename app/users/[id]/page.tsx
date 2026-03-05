// your code here for S2 to display a single user profile after having clicked on it
// each user has their own slug /[id] (/1, /2, /3, ...) and is displayed using this file
// try to leverage the component library from antd by utilizing "Card" to display the individual user
// import { Card } from "antd"; // similar to /app/users/page.tsx

"use client";
// For components that need React hooks and browser APIs,
// SSR (server side rendering) has to be disabled.
// Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import { ApplicationError } from "@/types/error";
import { useParams } from "next/navigation";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import { Button, Card, Table, Flex, Modal, Form, Input} from "antd";
import type { TableProps } from "antd"; // antd component library allows imports of types


import useLocalStorage from "@/hooks/useLocalStorage";

// Optionally, you can import a CSS module or file for additional styling:
// import "@/styles/views/Dashboard.scss";

// Columns for the antd table of User objects
const columns: TableProps<User>["columns"] = [
  {
    title: "Username",
    dataIndex: "username",
    key: "username",
  },
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Id",
    dataIndex: "id",
    key: "id",
  },
  {
    title: "Bio",
    dataIndex: "bio",
    key: "bio"
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status"
  },
  {
    title: "Creation date",
    dataIndex: "creation_date",
    key: "creation_date",
    render: (value: string | null) => {
    if (!value) return "";
    const d = new Date(value);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");

    return `${yyyy}/${mm}/${dd}/${hh}:${min}`;
  },
  }
];


interface PasswordChangeValues {
  password: string;

}

const Profile: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [user, setUser] = useState<User | null>(null);
  const params = useParams<{ id: string}>();
  const [meId, setMeId] = useState<string | null>(null);
  const viewedId = String(params.id);

  const isOwnProfile = meId === viewedId;

  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModal = () => { setIsModalOpen(true)};
  const handleOk = () => {
    setIsModalOpen(false);
    form.submit();
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const {
    // value: token, // is commented out because we dont need to know the token value for logout
    // set: setToken, // is commented out because we dont need to set or update the token value
    clear: clearToken, // all we need in this scenario is a method to clear the token
  } = useLocalStorage<string>("token", ""); // if you wanted to select a different token, i.e "lobby", useLocalStorage<string>("lobby", "");
  const handleLogout = async () => {
    try {
      await apiService.post<void>("/users/logout", {});
    } finally {
      // Clear token using the returned function 'clear' from the hook
      clearToken();
      router.push("/");
    }
  };

  const passwordChange = async (values: PasswordChangeValues) => {
    try {
      // Call the API service and let it handle JSON serialization and error handling
      await apiService.put<User>(`/users/${params.id}`, values);
      handleLogout();

    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during the registration:\n${error.message}`);
      } else {
        console.error("An unknown error occurred during registration.");
      }
    }
  };


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // apiService.get<User[]> returns the parsed JSON object directly,
        // thus we can simply assign it to our users variable.
        const fetchedUser =  await apiService.get<User>(`/users/${params.id}`);
        setUser(fetchedUser);
        console.log("Fetched user:", fetchedUser);

        const me = await apiService.get<User>(`/users/me`);
        setMeId(me?.id ? String(me.id) : null);
      } catch (error) {
        const err = error as ApplicationError;
        if (err.status == 401){
          router.replace("/");
          alert(`You have to log in first to access users!`)
          return;
        }
        if (error instanceof Error) {
          alert(`Something went wrong while fetching users:\n${error.message}`);
        } else {
          console.error("An unknown error occurred while fetching users.");
        }
      }
    };

    fetchUsers();
  }, [apiService, params.id]); // dependency apiService does not re-trigger the useEffect on every render because the hook uses memoization (check useApi.tsx in the hooks).
  // if the dependency array is left empty, the useEffect will trigger exactly once
  // if the dependency array is left away, the useEffect will run on every state change. Since we do a state change to users in the useEffect, this results in an infinite loop.
  // read more here: https://react.dev/reference/react/useEffect#specifying-reactive-dependencies

  return (
    <div className="card-container">
      <Card
        loading={!user}
        title={user?`${user.name}'s Profile`:`${params.id}'s Profile`}
        className="dashboard-container"
      >
        {user && (
          <>
            {/* antd Table: pass the columns and data, plus a rowKey for stable row identity */}
            <Table<User>
              columns={columns}
              dataSource={[user]}
              rowKey="id"
              pagination={false}
            />
            <Flex align = "Center">
              <Button onClick={handleLogout} type="primary" disabled={!isOwnProfile} className="button-login"style={{ marginLeft: "0" }}>
                Logout
              </Button>
              <Button type="primary" className="button-login" disabled={!isOwnProfile} onClick={showModal} style={{ marginLeft: "auto" }} >
                Change Password
              </Button>
              <Modal
              className = "mono-modal"
              title="Change Password"
              closable={{ 'aria-label': 'Custom Close Button'}}
              open={isModalOpen}
              onOk={handleOk}
              onCancel={handleCancel}
              centered
              >
                <Form
                  form={form}
                  name="login"
                  size="large"
                  variant="outlined"
                  onFinish={passwordChange}
                  layout="vertical"
                >
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
                </Form>
              </Modal>
              <Button type="primary" className="button-login" onClick={() => router.push("/users")} style={{ marginLeft: "auto" }}>
                Users overview
              </Button>
            </Flex>
          </>
        )}
      </Card>
    </div>
  );
};
export default Profile;
