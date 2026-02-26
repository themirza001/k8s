import { useEffect, useState } from "react";
import { studentApi } from "./api/student.api";

function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", age: "" });

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    const data = await studentApi.getStudents();
    setStudents(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    await studentApi.addStudent({
      name: form.name,
      email: form.email,
      age: Number(form.age),
    });

    setForm({ name: "", email: "", age: "" });
    loadStudents();
  }


   return (
    <div style={{ padding: 20 }}>
      <h2>Add Student</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <br />

        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <br />

        <input
          placeholder="Age"
          type="number"
          value={form.age}
          onChange={(e) => setForm({ ...form, age: e.target.value })}
        />
        <br />

        <button type="submit">Add Student</button>
      </form>

      <hr />

      <h2>Registered Students</h2>
      <ul>
        {students.map((s) => (
          <li key={s.id}>
            {s.name} | {s.email} | Age: {s.age}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;