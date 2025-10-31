from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Optional
from pydantic import BaseModel
from app.simple_database import SimpleDatabase

router = APIRouter()

# Request models
class QuizSessionCreate(BaseModel):
    participant_name: str
    participant_surname: str
    quiz_type: str  # 'name_to_class', 'nation_to_class', 'class_to_flag', 'silhouette_to_class'
    total_questions: int
    time_per_question: int  # in seconds
    selected_unit_ids: List[int]  # NEW: IDs of selected naval units
    allow_duplicates: bool = False  # NEW: Allow same unit to appear multiple times

class QuizAnswer(BaseModel):
    session_id: int
    question_number: int
    user_answer: str

# Response models
class QuizSessionResponse(BaseModel):
    id: int
    participant_name: str
    participant_surname: str
    quiz_type: str
    total_questions: int
    time_per_question: int
    correct_answers: int
    score: int
    status: str
    started_at: str
    completed_at: Optional[str] = None

class QuizQuestionResponse(BaseModel):
    id: int
    session_id: int
    question_number: int
    question_type: str
    naval_unit_id: int
    name: str
    unit_class: str
    nation: Optional[str]
    silhouette_path: Optional[str]
    flag_path: Optional[str]
    layout_config: Optional[Dict]
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    user_answer: Optional[str] = None
    is_correct: Optional[bool] = None

@router.get("/quiz/available-units/{quiz_type}")
async def get_available_units_for_quiz(quiz_type: str):
    """Get available naval units for a specific quiz type"""
    if quiz_type not in ['name_to_class', 'nation_to_class', 'class_to_flag', 'silhouette_to_class']:
        raise HTTPException(status_code=400, detail="Invalid quiz type")

    units = SimpleDatabase.get_available_naval_units_for_quiz(quiz_type)
    return {
        "quiz_type": quiz_type,
        "available_units": len(units),
        "units": units
    }

@router.get("/quiz/nations")
async def get_nations_with_units():
    """Get list of nations that have naval units"""
    nations = SimpleDatabase.get_nations_with_units()
    return {"nations": nations}

@router.post("/quiz/session")
async def create_quiz_session(quiz_data: QuizSessionCreate):
    """Create a new quiz session with selected units"""
    # Validate quiz type
    if quiz_data.quiz_type not in ['name_to_class', 'nation_to_class', 'class_to_flag', 'silhouette_to_class']:
        raise HTTPException(status_code=400, detail="Invalid quiz type")

    # Validate question count
    if quiz_data.total_questions < 1 or quiz_data.total_questions > 50:
        raise HTTPException(status_code=400, detail="Total questions must be between 1 and 50")

    # Validate time per question
    if quiz_data.time_per_question < 10 or quiz_data.time_per_question > 300:
        raise HTTPException(status_code=400, detail="Time per question must be between 10 and 300 seconds")

    # NEW: Validate selected units
    if not quiz_data.selected_unit_ids or len(quiz_data.selected_unit_ids) < 4:
        raise HTTPException(
            status_code=400,
            detail=f"At least 4 units must be selected. Currently selected: {len(quiz_data.selected_unit_ids)}"
        )

    # NEW: Validate questions vs selected units (if duplicates not allowed)
    if not quiz_data.allow_duplicates and quiz_data.total_questions > len(quiz_data.selected_unit_ids):
        raise HTTPException(
            status_code=400,
            detail=f"You selected {len(quiz_data.selected_unit_ids)} units but requested {quiz_data.total_questions} questions. Enable duplicates or reduce questions to max {len(quiz_data.selected_unit_ids)}."
        )

    # Create session
    session_id = SimpleDatabase.create_quiz_session(
        quiz_data.participant_name,
        quiz_data.participant_surname,
        quiz_data.quiz_type,
        quiz_data.total_questions,
        quiz_data.time_per_question
    )

    if not session_id:
        raise HTTPException(status_code=500, detail="Failed to create quiz session")

    # NEW: Generate questions from selected units only
    if not SimpleDatabase.generate_quiz_questions_from_selected_units(
        session_id,
        quiz_data.quiz_type,
        quiz_data.total_questions,
        quiz_data.selected_unit_ids,
        quiz_data.allow_duplicates
    ):
        raise HTTPException(status_code=500, detail="Failed to generate quiz questions")

    # Return session details
    session = SimpleDatabase.get_quiz_session(session_id)
    return {"session_id": session_id, "session": session}

@router.get("/quiz/session/{session_id}")
async def get_quiz_session(session_id: int):
    """Get quiz session details"""
    session = SimpleDatabase.get_quiz_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    return session

@router.get("/quiz/session/{session_id}/question/{question_number}")
async def get_quiz_question(session_id: int, question_number: int):
    """Get a specific question from a quiz session"""
    # Verify session exists
    session = SimpleDatabase.get_quiz_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    # Verify question number is valid
    if question_number < 1 or question_number > session['total_questions']:
        raise HTTPException(status_code=400, detail="Invalid question number")
    
    question = SimpleDatabase.get_quiz_question(session_id, question_number)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return question

@router.post("/quiz/answer")
async def submit_quiz_answer(answer: QuizAnswer):
    """Submit answer for a quiz question"""
    # Verify session exists and is active
    session = SimpleDatabase.get_quiz_session(answer.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    if session['status'] != 'active':
        raise HTTPException(status_code=400, detail="Quiz session is not active")
    
    # Verify question number is valid
    if answer.question_number < 1 or answer.question_number > session['total_questions']:
        raise HTTPException(status_code=400, detail="Invalid question number")
    
    # Submit answer
    if not SimpleDatabase.submit_quiz_answer(answer.session_id, answer.question_number, answer.user_answer):
        raise HTTPException(status_code=500, detail="Failed to submit answer")
    
    # Get the question with the correct answer to return feedback
    question = SimpleDatabase.get_quiz_question(answer.session_id, answer.question_number)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    is_correct = answer.user_answer.strip().lower() == question['correct_answer'].strip().lower()
    
    return {
        "is_correct": is_correct,
        "correct_answer": question['correct_answer'],
        "user_answer": answer.user_answer
    }

@router.post("/quiz/session/{session_id}/complete")
async def complete_quiz_session(session_id: int):
    """Complete a quiz session and calculate final score"""
    # Verify session exists
    session = SimpleDatabase.get_quiz_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    if session['status'] != 'active':
        raise HTTPException(status_code=400, detail="Quiz session is not active")
    
    # Complete the session
    if not SimpleDatabase.complete_quiz_session(session_id):
        raise HTTPException(status_code=500, detail="Failed to complete quiz session")
    
    # Return updated session details
    completed_session = SimpleDatabase.get_quiz_session(session_id)
    return completed_session

@router.get("/quiz/history")
async def get_quiz_history(limit: int = 50):
    """Get quiz session history"""
    if limit < 1 or limit > 100:
        limit = 50
    
    history = SimpleDatabase.get_quiz_history(limit)
    return {"history": history}

@router.get("/quiz/stats")
async def get_quiz_statistics():
    """Get quiz statistics"""
    try:
        history = SimpleDatabase.get_quiz_history(1000)  # Get larger sample for stats
        
        if not history:
            return {
                "total_sessions": 0,
                "average_score": 0,
                "quiz_type_distribution": {},
                "score_distribution": {}
            }
        
        total_sessions = len(history)
        total_score = sum(session['score'] for session in history)
        average_score = round(total_score / total_sessions, 2) if total_sessions > 0 else 0
        
        # Quiz type distribution
        quiz_type_distribution = {}
        for session in history:
            quiz_type = session['quiz_type']
            quiz_type_distribution[quiz_type] = quiz_type_distribution.get(quiz_type, 0) + 1
        
        # Score distribution (by grade ranges)
        score_distribution = {
            "18-21": 0,  # Sufficient
            "22-25": 0,  # Good
            "26-28": 0,  # Very Good
            "29-30": 0,  # Excellent
            "Below 18": 0  # Insufficient
        }
        
        for session in history:
            score = session['score']
            if score < 18:
                score_distribution["Below 18"] += 1
            elif score <= 21:
                score_distribution["18-21"] += 1
            elif score <= 25:
                score_distribution["22-25"] += 1
            elif score <= 28:
                score_distribution["26-28"] += 1
            else:
                score_distribution["29-30"] += 1
        
        return {
            "total_sessions": total_sessions,
            "average_score": average_score,
            "quiz_type_distribution": quiz_type_distribution,
            "score_distribution": score_distribution
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating statistics: {str(e)}")