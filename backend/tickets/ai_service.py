import json
import requests
import random
from pydantic import BaseModel
from typing import Literal, Optional

# Pydantic models for validation
class AIAnalysisResult(BaseModel):
    category: Literal["Billing", "Bug", "Access", "HR", "Server", "DB", "Feature", "Other"]
    summary: str
    severity: Literal["Critical", "High", "Medium", "Low"]
    resolution: Literal["Auto-resolve", "Assign"]
    sentiment: Literal["Frustrated", "Neutral", "Polite"]
    department: Literal["Engineering", "DevOps", "Finance", "HR", "IT", "Product", "Marketing", "Legal"]
    employee: Optional[str] = None
    confidence: int # 0 - 100
    estimated_time: Optional[str] = "TBD"
    ai_answer: Optional[str] = None

class SelectedEmployee(BaseModel):
    name: str
    email: str
    department: str

class AssignmentResult(BaseModel):
    selected_employee: Optional[SelectedEmployee] = None
    confidence: float # 0.0 - 1.0

class AIService:
    @staticmethod
    def analyze_ticket(title, description) -> AIAnalysisResult:
        """
        Calls the Ollama Llama LLM hosted at https://llm.mlopssol.ca for structured analysis.
        Acts as a DETERMINISTIC RULE-BASED ENGINE with zero conversational padding.
        """
        # Prompt for structured data
        prompt = f"""
        Analyze the following support ticket and return a strictly validated JSON object.
        
        Ticket Title: {title}
        Ticket Description: {description}

        STRICT SPECIFICATIONS:
        1. category: Choose from ["Billing", "Bug", "Access", "HR", "Server", "DB", "Feature", "Other"]
        2. severity: Choose from ["Critical", "High", "Medium", "Low"]
        3. resolution: 
           - 'Auto-resolve': ONLY for standard informational requests, password resets (if simple), or procedural questions solvable via self-service.
           - 'Assign': For any technical bug, system failure, security access, hardware issue, or complex business logic dispute.
        4. sentiment: Choose from ["Frustrated", "Neutral", "Polite"]
        5. department: Choose from ["Engineering", "DevOps", "Finance", "HR", "IT", "Product", "Marketing", "Legal"]
        6. confidence: Integer between 0 and 100.
        7. summary: 
           - Must be 2–3 sentences of HIGH-LEVEL TECHNICAL or CORPORATE analysis.
           - For general queries, summarize the inquiry with extreme professionalism.
           - Tone: Expert, Concise, Enterprise-grade.
        8. ai_answer:
           - Mandatory Format: EXACTLY 3 lines. Each must be a single, elite, professional sentence.
           - Line 1: RESOLUTION: [Concise technical explanation or briefing]. 
           - Line 2: IMPLEMENTATION: [Single-sentence deployment or action path]. 
           - Line 3: NEXT STEPS: [One-sentence verification or follow-up protocol].
           - Tone: Elite Senior Systems Engineer.

        Your response MUST be ONLY the JSON object, with NO extra text, reasoning, or markdown. 
        Format your response exactly like this template:
        {{
            "category": "Bug",
            "summary": "The primary database instance is experiencing 100% CPU utilization, causing query timeouts across the production cluster. Immediate indexing optimization or instance scaling is required to restore service availability.",
            "severity": "Critical",
            "resolution": "Assign",
            "sentiment": "Frustrated",
            "department": "Engineering",
            "employee": null,
            "confidence": 95,
            "estimated_time": "2 hours",
            "ai_answer": "RESOLUTION: [Detailed, clear solution]. IMPLEMENTATION: [Step-by-step guidance]. NEXT STEPS: [Actionable items for user]. Maintain an elite, authoritative corporate tone."
        }}
        """

        url = "https://llm.mlopssol.ca/api/chat"
        model_name = "llama3.1:8b-instruct-q4_K_M"
        
        payload = {
            "model": model_name,
            "messages": [
                {
                    "role": "system", 
                    "content": """You are an ELITE ENTERPRISE IT HELPDESK decision engine. 
                    - Your task is to generate technical, high-quality, and non-generic support resolutions.
                    - If Auto-resolve, never provide vague advice like 'contact support' or 'try again later'.
                    - Provide specific step-by-step implementation instructions.
                    - Maintain an authoritative helpdesk tone: structured, clear, and professional. 
                    - Avoid all conversational filler."""
                },
                {"role": "user", "content": prompt}
            ],
            "options": {
                "temperature": 0.0
            },
            "stream": False
        }


        try:
            response = requests.post(url, json=payload, timeout=60)
            response.raise_for_status()
            
            data = response.json()
            # Ollama's native API returns result in message['content']
            content = data['message']['content'].strip()

            # Stripping possible markdown JSON markers
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            # Additional cleanup for any trailing text (sometimes happens with smaller models)
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            if json_start != -1 and json_end != -1:
                content = content[json_start:json_end]

            # Use strict=False to handle unescaped control characters like newlines or tabs
            try:
                result_data = json.loads(content, strict=False)
            except json.JSONDecodeError as jde:
                # If it still fails, try to manually escape problematic chars
                sanitized = content.replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
                result_data = json.loads(sanitized, strict=False)
            
            # Map null to None for Pydantic if necessary
            if result_data.get("employee") == "null" or result_data.get("employee") is None:
                result_data["employee"] = None

            return AIAnalysisResult(**result_data)

        except Exception as e:
            raise Exception(f"Llama Analysis failed: {str(e)}")


    @staticmethod
    def assign_employee(ticket_data: dict, employee_directory: list) -> AssignmentResult:
        """
        Elite AI Assignment Engine: Selects the MOST SUITABLE employee based on skill match, 
        availability, load, and performance. Operates on a deterministic scoring matrix.
        """
        url = "https://llm.mlopssol.ca/api/chat"
        model_name = "llama3.1:8b-instruct-q4_K_M"
        
        prompt = f"""
        Select the MOST SUITABLE employee for the following ticket based on the provided directory.
        
        TICKET DATA:
        {ticket_data}
        
        EMPLOYEE DIRECTORY:
        {employee_directory}

        STRICT TASK:
        1. Calculate scores: (skill*0.35) + (availability*0.25) + (load*0.2) + (speed*0.1) + (resolved_count*0.1)
        2. Filter out: Wrong department, On Leave status.
        3. Select ONLY ONE (highest score).

        Format your response exactly like this JSON template:
        {{
            "selected_employee": {{
                "name": "string",
                "email": "string",
                "department": "string"
            }},
            "confidence": 0.0-1.0
        }}
        
        If no suitable employee exists, set 'selected_employee' to null.
        """

        payload = {
            "model": model_name,
            "messages": [
                {
                    "role": "system", 
                    "content": "You are a DETERMINISTIC AI ASSIGNMENT ENGINE. Your ONLY job is to select the single best employee from a list based on scoring rules. Output ONLY valid JSON."
                },
                {"role": "user", "content": prompt}
            ],
            "options": {
                "temperature": 0.0
            },
            "stream": False
        }
        
        try:
            response = requests.post(url, json=payload, timeout=60)
            response.raise_for_status()
            content = response.json()['message']['content'].strip()
            
            # Extract JSON
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            if json_start != -1 and json_end != -1:
                content = content[json_start:json_end]

            return AssignmentResult.model_validate_json(content)
        except Exception as e:
            print(f"Assignment failed: {e}")
            return AssignmentResult(selected_employee=None, confidence=0.0)
