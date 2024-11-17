"use server";
import { Account, Avatars, Client, Databases, Storage } from "node-appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { cookies } from "next/headers";
// import { handleError } from "../actions/user.action";

// export const createSessionClient = async () => {
//   const client = new Client()
//     .setEndpoint(appwriteConfig.endpointUrl)
//     .setProject(appwriteConfig.projectId);

//   try {
//     const session = (await cookies()).get("appwrite-session");

//     if (!session || !session.value) throw new Error("No session");

//     client.setSession(session.value);
//   } catch (error) {
//     console.log(error);
//     handleError(error, "Error creating session client");
//   }

//   return {
//     get account() {
//       return new Account(client);
//     },
//     get databases() {
//       return new Databases(client);
//     },
//   };
// };

export const createAdminClient = async () => {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId)
    .setKey(appwriteConfig.secretKey);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
    get storage() {
      return new Storage(client);
    },
    get avatars() {
      return new Avatars(client);
    },
  };
};

export const createSessionClient = async () => {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId);

  // Retrieve session cookie
  const session = (await cookies()).get("appwrite-session");

  if (!session || !session.value) {
    console.error("Session cookie missing or invalid.");
    throw new Error("No session");
  }

  // Set session for Appwrite client
  try {
    client.setSession(session.value);
    console.log("Appwrite session set successfully:", session.value);
  } catch (error) {
    console.error("Error setting Appwrite session:", error);
    throw new Error("Failed to set session");
  }

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
  };
};
