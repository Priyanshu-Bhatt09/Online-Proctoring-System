"use client";

import { ExamFormValues, examSchema } from "@/app/schema/exam-schema";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import QuestionCard from "./question-card";
import { closestCenter, DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableQuestion from "./sortable-question";

export default function ExamForm() {
    //useForm - hook from react-hook-form
   const methods = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema), //this tells- use the zod schema to validate the form
    defaultValues: { //this sets the initial state of the form
        title: "",
        questions: []
    }
   });

   const {control, register, handleSubmit} = methods; //methods is an object that contains many utilities for managing a form, and this line says take these specific properties from methods object and store them in seprate variable


const {fields, append, remove, move} = useFieldArray({ //usefieldarray - hook from react-hook-form designed for arrays inside form
    control, //connects this field array to the form created earlier with useForm
    name: "questions" //this tells ReactHookForm - the dynamic array we want to manage is called questions
});

function handleDragEnd(event: any) {
    const {active, over} = event; //active - the item we dragged, and over - the item you dropped on
    if(!over) return; //someties we drop outside the list in that case we stop

    if(active.id !== over.id) { //check if position changed, if we drop the item on itself no need to reorder
        const oldIndex = fields.findIndex(f => f.id === active.id); //this finds where the old item was before
        const newIndex = fields.findIndex(f => f.id === over.id); //finds the new index where the item was dropped

        move(oldIndex, newIndex);
    }
}

const addQuestion = () => {
    append({
        text: "",
        points: 1,
        options: [
            {text: "", isCorrect: false},
            {text: "", isCorrect: false}
        ]
    });
};

const onSubmit = (data: ExamFormValues) => {
    console.log("Exam data values", data);
}
// const inputProps = register("title"); to see what properties does ...register return 
// console.log(inputProps);
return(
    // the ...methods spreads everything returned by useForm into FormProvider like this - <formProvider register = {methods.register}, control = {methods.control}
    // with this now child components like questionCard can access the form without passing the props - eg - const {register} = useFormContext();
    <FormProvider {...methods}> 
        <form onSubmit={handleSubmit(onSubmit)}>
            <input 
            {...register("title")} //here spread operator is used to spread properties returned by register() onto the input element
            placeholder="Exam Title"
            />

            <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            >
            <SortableContext
            items={fields.map(f => f.id)}
            strategy={verticalListSortingStrategy}
            >

            {fields.map((field, index) => ( //fields represents the current list of questions, map loop renders one question per component
            <SortableQuestion //this renders a question card component for each render
            key={field.id} //react requires unique key when rendering lists, React Hook form automatically generates field.id for this purpose
            id={field.id}
            index={index} //this tells question card which question it is
            remove={remove} //allows a question to delete itself
            />
            ))}

            </SortableContext>
            </DndContext>

            

            <button
            type="button" onClick={addQuestion}
            >Add Question</button>

            <button type="submit">Save Exam</button>
        </form>
    </FormProvider>
);

}

 

