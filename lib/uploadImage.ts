import { ID, storage } from "@/appwrite";

const uplaodImage = async (file: File) => {

    if(!file) return;

    const fileUpload = await storage.createFile(
        process.env.NEXT_PUBLIC_APPWRITE_TODOS_STORAGE_ID!,
        ID.unique(),
        file
    );
    return fileUpload;
};

export default uplaodImage;