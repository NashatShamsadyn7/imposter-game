# Football AI commentator

The football result is always calculated locally first. Gemini only writes the match report, so an unavailable API never changes a winner or breaks the game.

1. Rotate any key that was shared in chat.
2. In the project terminal, set the secret (do not put it in `.env` or a `VITE_` variable):

   ```powershell
   supabase secrets set GEMINI_API_KEY=YOUR_NEW_KEY GEMINI_MODEL=gemini-3.5-flash
   supabase functions deploy football-commentary
   ```

3. The app invokes `football-commentary` automatically when Supabase is enabled. If the function or secret is not available, it shows the local Kurdish report instead.
