from fastapi import FastAPI, WebSocket
from dotenv import load_dotenv
import os
import requests

app = FastAPI()

mode = 'chat'
style = 'kawaii'

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        question = await websocket.receive_text()
        # Condition if user enters an empty string
        if not question:
             await websocket.send_text("Empty Text not acceptable. Please write something in the Text-BOX.")
        else:
            # Carregar variáveis do arquivo development.env
            load_dotenv("development.env")

            ollama_host_api = os.getenv("OLLAMA_HOST")
            url_api = f"{ollama_host_api}/api/chat"

            if '@hitch' in question:
                clean_question = question.replace('@hitch', '').strip()
                system_prompt = { "role": "system", "content": "Você é um consultor de relacionamentos, informe o usuário sobre seu desempenho na conversa, erros, modos de falar, melhoria e outros" }
                context = "Seu nome é Hitch, você é um conselheiro amoroso e responda sempre em português"
            else:
                clean_question = question
                system_prompt = { "role": "system", "content": "Você é uma garota, aja como se você estivesse namorando" }
                context = f"Você é uma namoradinha estilo {style} e responda sempre em português"

            if mode == 'chat':
                payload_chat = {
                    "model": "gemma3:12b",
                    "messages": [
                        system_prompt,
                        { "role": "user", "content": clean_question }
                    ],
                    "context": context,
                    "temperature": 0.8,
                    "stream": False,
                    "context_window": 2048
                }

                response_json = requests.post(url_api, json=payload_chat)

                if '@hitch' in question:
                    response_text = '@hitch disse: ' + response_json.json()['message']['content']
                else:
                    response_text = response_json.json()['message']['content']

                await websocket.send_text(response_text)
            else:
                payload = {
                    "model": "gemma3:12b", # "gpt-oss:20b",
                    "prompt": question,
                    "temperature": 0.8,
                    "stream": False,
                    "context_window": 2048
                }

                response_json = requests.post(url_api, json=payload)

                await websocket.send_text(response_json.json()['response'])