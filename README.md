# Vistula Task Manager Extended

**Student ID:** 73454  
**Deployed Application:** https://73454tughan.github.io/vistula-task-manager-extended/

---

## Database Structure

The application uses a PostgreSQL database hosted on Supabase with two tables:

- **`categories`**
  - `id` (`BIGINT`, Primary Key, auto-generated)
  - `name` (`TEXT`, `NOT NULL`)
- **`tasks`**
  - `id` (`BIGINT`, Primary Key, auto-generated)
  - `title` (`TEXT`, `NOT NULL`)
  - `description` (`TEXT`, optional)
  - `completed` (`BOOLEAN`, default `false`)
  - `category_id` (`BIGINT`, Foreign Key referencing `categories.id`)

### Relationship Between `tasks` and `categories`
`categories` and `tasks` have a **one-to-many (`1:N`)** relationship. Each category can contain multiple tasks, and each task belongs to one category via the `category_id` foreign key.

---

## Example Supabase REST API Requests

- **Retrieve all categories:**
  `GET /rest/v1/categories?select=*`
- **Create a category:**
  `POST /rest/v1/categories` with JSON body `{"name": "University"}`
- **Retrieve tasks with category names:**
  `GET /rest/v1/tasks?select=*,categories(name)`
- **Retrieve tasks from a selected category:**
  `GET /rest/v1/tasks?category_id=eq.1`
- **Retrieve incomplete tasks:**
  `GET /rest/v1/tasks?completed=eq.false`
- **Update a task (including its category):**
  `PATCH /rest/v1/tasks?id=eq.1` with JSON body `{"title": "Updated", "category_id": 2}`

---

## Team Collaboration (Pull Requests)

- **Partner's PR (added `statistics.html` to this repository):** <PASTE_PR_1_URL_HERE>
- **My PR (added `statistics.html` to partner's repository):** <PASTE_PR_2_URL_HERE>
