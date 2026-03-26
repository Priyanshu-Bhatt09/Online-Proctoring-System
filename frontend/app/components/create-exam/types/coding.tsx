import { Editor } from "@monaco-editor/react";

export default function Coding() {
    return(
        <div className="w-fit border my-2 mx-5 ">
        <Editor
        height="300px"
        width="800px"
        defaultLanguage="javascript"
        defaultValue="//Write code here"
        />
        </div>
        
    );
}