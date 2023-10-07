/* eslint-disable react/jsx-no-undef */
'use client'
import { useBoardStore } from '@/store/BoardStore';
import React, { useCallback, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import Column from './Column';
function Board() {

  const [board, getBoard, setBoardState, updateTodoDB] = useBoardStore((state) => [state.board, state.getBoard, state.setBoardState, state.updateTodoDB]);

  useEffect(() => {
    getBoard()
  }, [getBoard])

  console.log(board)

  const handleDragEnd = (result: DropResult) => {
    // console.log("Board is : ", board)
    const { destination, source, type} = result;
    // console.log("SOURCE is : ",source)
    // console.log("DESTINATION is : ",destination)
    // console.log("type is  : ",type)

    //if the item is dragged out of the board
    if(!destination) return;

    //handle column drag (example: dragging to reorder todo/inprogress/done columns)
    if(type === 'column'){
      const entries = Array.from(board.columns.entries());
      // console.log("Entries are: ",entries)
      const [removed] = entries.splice(source.index, 1); //removed has column you are trying to drag inside the board
      entries.splice(destination.index, 0, removed) //pushes the dragged column data to the destination index of the board 
      const rearrangedMap = new Map(entries);
      console.log(rearrangedMap)
      setBoardState({...board, columns: rearrangedMap})
    }

    //handle type=card draggable items:
    //dnd library uses indexes as 0,1,2,3... instead of ids
    const columns = Array.from(board.columns);
    console.log(columns)
    const startColIdx = columns[Number(source.droppableId)]
    const endColIdx = columns[Number(destination.droppableId)]

    const startCol: Column = {
      id: startColIdx[0],
      todos: startColIdx[1].todos
    }

    const endCol: Column = {
      id: endColIdx[0],
      todos: endColIdx[1].todos
    }

    console.log(startCol)
    console.log(endCol)

    //let's protect them if they are trying to be dragged out of columns - to some unidentified place on the page
    if( !startCol || !endCol) return;

    console.log(source.index)
    console.log(destination.index)

    //let's not do anything if they are dragged around and brought back to the same column's same position :) in short :) source === destination
    if(source.index === destination.index && startCol === endCol) return;

    //grab the item you are trying to drag over
    const newTodos = startCol.todos;
    const [todoMoved] = newTodos.splice(source.index, 1);
    console.log(newTodos)

    if( startCol.id === endCol.id ){
      //dragging todos inside same column
      newTodos.splice(destination.index, 0, todoMoved)
      const newCol = {
        id: startCol.id,
        todos: newTodos
      }

    const newColumns = new Map(board.columns);
    newColumns.set(startCol.id, newCol);

    setBoardState({...board, columns: newColumns })

    }else{
      //dragging todo from one column to another

      //make a copy of destination column
      const endTodos = Array.from(endCol.todos);
      endTodos.splice(destination.index, 0, todoMoved)

      const newColumns = new Map(board.columns);
      newColumns.set(startCol.id, {
        id: startCol.id,
        todos: newTodos
      });
      newColumns.set(endCol.id, {
        id: startCol.id,
        todos: endTodos
      });

      //update to db
      updateTodoDB(todoMoved, endCol.id)

      setBoardState({...board, columns: newColumns})

    }





  }
  

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="board" direction='horizontal' type='column'>
        {(provided, snapshot) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className='grid grid-cols-1 md:grid-cols-3 gap-5 max-w-7xl mx-auto'>
            {
              Array.from(board.columns.entries()).map(([id, column], index) => (
                <Column key={id} id={id} todos={column.todos} index={index} />
              ))
            }
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}

export default Board
