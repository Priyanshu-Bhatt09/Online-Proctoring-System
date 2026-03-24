//validation schema
import {z} from 'zod'; //zod is a ts first schema validation library

export const optionSchema = z.object({
    text: z.string().min(1, "Options cannot be empty"), //this means the string should contain atleast one character
    isCorrect: z.boolean()
});

export const questionSchema = z.object({
    text: z.string().min(1, "Question required"),
    points: z.number().min(1),
    negativePoint: z.number().min(0),
    options: z.array(optionSchema).min(2),
    type: z.enum([
        "MCQ",
        "MCA",
        "SHORT_TEXT",
        "CODING",
        "INPUT",
        "MATCH",
        "COMPREHENSION"
    ])
});

export const examSchema = z.object({
    title: z.string().min(1),
    questions: z.array(questionSchema).min(1)
});

export type ExamFormValues = z.infer<typeof examSchema>