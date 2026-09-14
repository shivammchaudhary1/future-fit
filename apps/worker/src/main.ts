const queues = ["assessment-scoring", "career-matching", "ai-interpretation", "pdf-generation", "email", "push-notification", "school-analytics", "audit-processing"] as const;
console.info(JSON.stringify({ service: "future-fit-worker", status: "ready", queues }));
