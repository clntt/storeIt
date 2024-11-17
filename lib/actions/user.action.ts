"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { parseStringify } from "../utils";
import { cookies } from "next/headers";
import { avatarPlaceholderUrl } from "@/constants";
import { redirect } from "next/navigation";

// export const getUserByEmail = async (email: string) => {
//   const { databases } = await createAdminClient();

//   const result = await databases.listDocuments(
//     appwriteConfig.databaseId,
//     appwriteConfig.usersCollection,
//     [Query.equal("email", [email])]
//   );

//   return result.total > 0 ? result.documents[0] : null;
// };

export const handleError = async (error: unknown, message: string) => {
  console.log(error, message);
  throw error;
};

export const sendEmailOTP = async ({ email }: { email: string }) => {
  const { account } = await createAdminClient();

  try {
    const session = await account.createEmailToken(ID.unique(), email);
    return session.userId;
  } catch (error) {
    handleError(error, "Error sending email OTP");
  }
};

export const createAccount = async ({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) => {
  const existingUser = await getUserByEmail(email);

  const accountId = await sendEmailOTP({ email });
  if (!accountId) throw new Error("Failed to send an OTP");

  if (!existingUser) {
    const { databases } = await createAdminClient();

    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollection,
      ID.unique(),
      {
        fullName,
        email,
        avatar: avatarPlaceholderUrl,
        accountId,
      }
    );
  }

  return parseStringify({ accountId });
};

// export const verifySecret = async ({
//   accountId,
//   password,
// }: {
//   accountId: string;
//   password: string;
// }) => {
//   try {
//     const { account } = await createAdminClient();

//     const session = await account.createSession(accountId, password);

//     (await cookies()).set("appwrite-session", session.secret, {
//       path: "/",
//       httpOnly: true,
//       sameSite: "strict",
//       secure: true,
//     });

//     return parseStringify({ sessionId: session.$id });
//   } catch (error) {
//     handleError(error, "Failed to verify OTP");
//   }
// };

// export const getCurrentUser = async () => {
//   try {
//     const { databases, account } = await createSessionClient();

//     const result = await account.get();

//     const user = await databases.listDocuments(
//       appwriteConfig.databaseId,
//       appwriteConfig.usersCollection,
//       [Query.equal("accountId", result.$id)]
//     );

//     if (user.total <= 0) return null;

//     return parseStringify(user?.documents[0]);
//   } catch (error) {
//     console.log(error);
//   }
// };

export const signOutUser = async () => {
  const { account } = await createSessionClient();
  try {
    await account.deleteSession("current");
    (await cookies()).delete("appwrite-session");
  } catch (error) {
    handleError(error, "Failed to sign out user");
  } finally {
    redirect("/sign-in");
  }
};

export const signInUser = async ({ email }: { email: string }) => {
  try {
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      await sendEmailOTP({ email });
      return parseStringify({ accountId: existingUser.accountId });
    }

    return parseStringify({ accountId: null, error: "User not found" });
  } catch (error) {
    handleError(error, "Failed to sign out user");
  }
};

export const getUserByEmail = async (email: string) => {
  const { databases } = await createAdminClient();

  try {
    const result = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollection,
      [Query.equal("email", [email])]
    );

    if (result.total === 0) {
      console.warn(`No user found with email: ${email}`);
      return null;
    }

    return result.documents[0];
  } catch (error) {
    console.error("Error fetching user by email:", error);
    throw new Error("Failed to fetch user");
  }
};

export const getCurrentUser = async () => {
  try {
    const { account, databases } = await createSessionClient();

    const result = await account.get();

    const user = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollection,
      [Query.equal("accountId", result.$id)]
    );

    if (user.total === 0) {
      console.warn("No user document found for the accountId:", result.$id);
      return null;
    }

    return parseStringify(user.documents[0]);
  } catch (error) {
    console.error("Error fetching current user:", error);
    throw new Error("Failed to retrieve current user");
  }
};

export const verifySecret = async ({
  accountId,
  password,
}: {
  accountId: string;
  password: string;
}) => {
  try {
    const { account } = await createAdminClient();

    const session = await account.createSession(accountId, password);

    console.log("Session created successfully:", session);

    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return parseStringify({ sessionId: session.$id });
  } catch (error) {
    console.error("Failed to verify secret:", error);
    handleError(error, "Failed to verify OTP");
  }
};
