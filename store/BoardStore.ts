import { ID, databases, storage } from '@/appwrite';
import { getTodosGroupedByColumn } from '@/lib/getTodosGroupedByColumn';
import uploadImage from '@/lib/uploadImage';
import { create } from 'zustand'

interface BoardState {
    board: Board;
    getBoard: () => void;
    setBoardState: (board: Board) => void;
    updateTodoDB: (todo: Todo, columnId: TypedColumn) => void;

    newTaskInput: string;
    setNewTaskInput: ( newTaskInput: string) => void;

    newTaskType: TypedColumn;
    setNewTaskType: (columnId: TypedColumn) => void;

    searchString: string;
    setSearchString: (searchString: string) => void;

    image: File | null;
    setImageFile: (imageFile: File | null) => void;

    addTask: (todo: string, columnId: TypedColumn, image?: File | null) => void
    deleteTask: (taskIndex: number, todo: Todo, id: TypedColumn) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  board: {
    columns: new Map<TypedColumn, Column>()
  },
  getBoard: async() => {
    const board = await getTodosGroupedByColumn();
    set({board})

  },
  setBoardState: (board) => set({board}),
  updateTodoDB: async (todo, columnId) => {
    await databases.updateDocument(process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!, process.env.NEXT_PUBLIC_APPWRITE_TODOS_COLLECTION_ID!, todo.$id, {
      title: todo.title,
      status: columnId
    })

  },
  searchString: "",
  setSearchString: (s) => {
    set({searchString: s })
  },

  addTask: async (todo: string, columnId: TypedColumn, image?: File | null) => {

    let file: Image | undefined;
    
    if(image){
      const fileUploaded = await uploadImage(image);
      if(fileUploaded){
        file = {
          bucketId: fileUploaded.bucketId,
          fileId: fileUploaded.$id
        }

      }
    }

    const { $id } = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!, process.env.NEXT_PUBLIC_APPWRITE_TODOS_COLLECTION_ID!,ID.unique(),{
        title:todo,
        status: columnId,
        ...(file && {image: JSON.stringify(file)})
      }
    );

    set({newTaskInput: ""});

    set((state) => {
      const newColumns = new Map(state.board.columns);

      const newTodo: Todo = {
        $id,
        $created_at: new Date().toISOString(),
        title: todo,
        status: columnId,
        ...(file && {image: file})
      }

      const column = newColumns.get(columnId);
      if(!column){
        newColumns.set(columnId,{
          id: columnId,
          todos: [newTodo]
        })
      }else{
        newColumns.get(columnId)?.todos.push(newTodo)
      }

      return {
        board: {
          columns: newColumns
        }
      }
    })
  },

  deleteTask: async (taskIndex: number, todo: Todo, id: TypedColumn) => {

    const newCols = new Map(get().board.columns) //copy of cloumns

    //delete
    newCols.get(id)?.todos.splice(taskIndex, 1)

    set({board: {columns: newCols}})

    if(todo.image){
      await storage.deleteFile(todo.image.bucketId, todo.image.fileId)
    }

    await databases.deleteDocument(process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!, process.env.NEXT_PUBLIC_APPWRITE_TODOS_COLLECTION_ID!, todo.$id)

  },

  newTaskInput:"",
  setNewTaskInput: (s) => {
    set({newTaskInput: s})
  },

  newTaskType:"todo",
  setNewTaskType: (colId) => {
    console.log("from board store: ",colId)
    set({newTaskType: colId})
  },

  image: null,
  setImageFile: (imagefile: File | null) => {
    set({image: imagefile})
  },
}))