
<div align="center">

# 🏛️ UNIVO
### *The Digital Heart of Campus*

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-Styling-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Status](https://img.shields.io/badge/Status-v1.0.2_Release-blue?style=for-the-badge&logo=github)](https://github.com/)

<!-- Language Switcher -->
<p align="center">
  <a href="README.TR.md">
    <img src="https://img.shields.io/badge/Türkçe-Switch_to_Turkish-E30A17?style=for-the-badge&logo=google-translate&logoColor=white" alt="Switch to Turkish">
  </a>
  <a href="README.md">
    <img src="https://img.shields.io/badge/English-Active-2ea44f?style=for-the-badge&logo=google-translate&logoColor=white" alt="English">
  </a>
</p>

<p align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmV3bWY3cW55cnZ5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z/xTiTnxpQ3ghPiB2Hp6/giphy.gif" width="100%" alt="Univo Banner Animation">
  <!-- (Placeholder for actual demo GIF if available in future) -->
</p>

---

## 🚀 Release Notes: v1.0.1 → v1.0.2
**📅 January 11, 2026 (Evening)**

This update focuses on deep stability, social features, and pixel-perfect UI refinements.

### ✨ Highlights
- **🔍 Manual Encoding Audit (100% Clean):**
    - A line-by-line manual audit was performed across all critical files (`VoiceView.tsx`, `CommentSystem.tsx`, `VoiceStatsWidget.tsx`).
    - All lingering "Minecraft language" artifacts (encoding errors) have been purged.
- **👥 Social & Profile Integration:**
    - 3-dot menus in posts and comments now feature **"Add Friend"** and **"View Profile"** buttons for non-owners.
    - Standardized Social UI: The profile visit button now matches the aesthetic of our friendship action buttons.
- **🛡️ Ownership Hardening:**
    - "Edit" and "Delete" options are now strictly conditional, appearing only for content owners to prevent UI clutter and accidental interaction triggers.
- **🎨 Threading & Layout Fixes:**
    - **Dynamic Connectors**: Fixed the vertical line over-extension bug in comment threads. The rail now scales perfectly with content.
    - **Hashtag Resilience**: Regex patterns updated with Unicode escapes (`\uXXXX`) for permanent encoding stability.

### 🛠️ Technical Changelog
> **v1.0.2**
> * `feat(social)`: Integrated `FriendButton` and Profile links into common 3-dot menus.
> * `fix(ui)`: Resolved vertical line bleeding in `VoiceView` avatar column by removing hardcoded `h-56` constraints.
> * `fix(encoding)`: Conducted full manual audit; replaced all corrupted characters with clear UTF-8 equivalents.
> * `refactor`: Unified button styles and casing across `CommentItem` and `VoiceItem`.



## 🚀 Release Notes: v1.0.0 → v1.0.1
**📅 January 11, 2026**

With today's update, **Univo** has become much more stable, faster, and user-friendly. Here's what's new in **v1.0.1**:

### ✨ Highlights
- **🎨 Crystal Clear UI (Header Sync):**
    - The millisecond delay between the PC header and the page body has been **completely eliminated**.
    - No more "white flash" or layout shifts on load; thanks to `HeaderSkeleton` and `!transition-none` optimizations, experience a buttery smooth load.
- **📝 Seamless Post Editing:**
    - You can now safely edit your posts and **#hashtags**.
    - Server-side verification added: What you see on your screen is exactly what is committed to the database.
- **⚡ Smart Agenda:**
    - When you update a post, the "Campus Agenda" (Sidebar) cards update instantly without needing a page refresh.
- **🧹 Project Cleanup:**
    - Dozens of temporary files and logs in the root directory have been cleaned. SQL files moved to `database/`, legacy assets to `archive/`.

### 🛠️ Technical Changelog
> **v1.0.1**
> * `fix(ui)`: Removed PC Header transition animations to ensure synchronization.
> * `feat(skeleton)`: Added `HeaderSkeleton`, `VoiceViewSkeleton`, `CommunityViewSkeleton` components.
> * `fix(api)`: Removed `.single()` from `PUT /api/voices/[id]` endpoint to resolve "Cannot coerce..." error.
> * `fix(frontend)`: Implemented optimistic updates with server confirmation for `VoiceView` editing.
> * `chore`: Cleaned project file structure, organized `.sql` and log files.

---

## 🎉 Initial Release: v1.0.0 (MVP)
**📅 January 10, 2026**

The birth of Univo. The first stable release digitizing the campus experience.

### 🏛️ Core Features (Initial Release)
- **Authentication:**
    - One-Click Login with Google (Supabase Auth).
    - `@metu.edu.tr` email verification support.
    - Profile creation (Nickname, Department, Avatar).
- **Campus Voice (Beta):**
    - Anonymous or public identity post sharing.
    - Like/Dislike and Comment system.
    - "Editor's Choice" and "Hot Agenda" filters.
- **Community Square:**
    - Event listing and detail view.
    - "Join" button for event registration (RSVP).
    - Event categories (Seminar, Party, Career).
- **Official Agenda:**
    - Cafeteria menu integration (Real-time data).
    - University announcements and academic calendar.
- **Interface:**
    - Modern, responsive design.
    - Dark/Light Mode support.
    - Bottom navigation bar for easy access (Mobile).

---

## 🌟 Key Features

### 📢 Campus Voice
A free space where students share ideas anonymously or openly.
- **Anonymous Mode:** Join discussions while hiding your identity.
- **Hashtag Support:** Set the agenda with tags like `#midterms`, `#festival`.
- **Moderation:** Automatic and manual filters for a safe campus environment.

### 🏘️ Community Square
The meeting point for clubs, communities, and events.
- **Event Cards:** Stylish cards with date, location, and details.
- **Badge System:** Turn your profile into a "Community Star" with events you attend.
- **Categories:** Music, Science, Sports... Filter by your interests.

### 🏛️ Official Agenda
Latest announcements, cafeteria menu, and official news from our university.
- **Food Menu:** See the daily menu with photos and calorie counts.
- **Academic Calendar:** Never miss critical dates.
- **Caching:** Instantly access last viewed announcements even with slow internet.

---

## 💻 Tech Stack
This project is built with the latest versions of modern web technologies.

| Area | Technology | Notes |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 15 (App Router)](https://nextjs.org) | Server Components & Suspense |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type safety and scalability |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first design & animate-shimmer |
| **Backend / DB** | [Supabase](https://supabase.com/) | PostgreSQL, Auth, Realtime, Storage |
| **State** | React Hooks & Context | Lightweight client state management |

---

## 🚀 Installation (Local Development)

To run the project on your machine:

1.  **Clone the Repo:**
    ```bash
    git clone https://github.com/keremdogan1/univo-mvp.git
    cd univo-mvp
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    # or
    bun install
    ```

3.  **Environment Variables (.env.local):**
    Create `.env.local` in the project root and enter your Supabase keys:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Start the App:**
    ```bash
    npm run dev
    ```
    Navigate to `http://localhost:3000` in your browser.

---

</div>
