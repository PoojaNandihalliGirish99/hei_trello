import { databases } from "@/appwrite";

export const getTodosGroupedByColumn = async() => {
    const data =  await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_TODOS_COLLECTION_ID!
    )
    console.log(data)
    const todos = data.documents;   
    const columns = todos.reduce((acc, todo) => {

        if(!acc.get(todo.status)){
            acc.set(todo.status, {
                id: todo.status,
                todos: []
            })
        }

        acc.get(todo.status)!.todos.push({
            $id: todo.$id,
            $created_at: todo.$created_at,
            title: todo.title,
            status: todo.status,
            ...(todo.image && {image: JSON.parse(todo.image)})
        })

        return acc;
    }, new Map<TypedColumn, Column>)
    console.log(columns)


    //if we don't have any items under "done" for example, the below code sets the todos array of done type to []
    //inshort, you will always have map of three.
    const columnTypes: TypedColumn[] = ["todo", "inprogress", "done"];
    for(const columnType of columnTypes){
        if(!columns.get(columnType)){
            columns.set(columnType,{
                id:columnType,
                todos:[]
            })
        }
    }

    console.log(columns);
    const sortedColumns = new Map(
        Array.from(columns.entries()).sort((a, b) => (
            columnTypes.indexOf(a[0]) - columnTypes.indexOf(b[0])
        ))
    )

    const board: Board = {
        columns: sortedColumns
    }

    return board
}