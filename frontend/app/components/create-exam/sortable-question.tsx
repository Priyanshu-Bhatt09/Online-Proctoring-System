"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import QuestionCard from "./question-card";

export default function SortableQuestion({id, index, remove} : any) {
    //setNodeRef - connect your DOM element(div, h1, h2 or anything) to the drag system, we attach it like ref = {setNodeRef}
    //transform - contains movement data while dragging
    //transition - controls animation when items reorder
    //attributes - accessibility + drag metadata
    //listeners - these are event handlers like on mousetouch 
    const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id});

    const style = {
        transform: CSS.Transform.toString(transform), //converts x:120, y:40 to transform:translate3d(120px, 40px, 0) so the element acutally moves on the screen
        transition
    };

    return(
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <QuestionCard index={index} remove={remove} />
        </div>
    )
}