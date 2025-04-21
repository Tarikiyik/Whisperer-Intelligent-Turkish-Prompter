import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext, ttk
import threading, asyncio, os, dotenv, logging
from tts_service import TurkishTTS
from stt_service import run_deepgram
from speech_monitor import SpeechMonitor

# Fixed transcript file path (used by STT and SpeechMonitor)
TRANSCRIPT_FILE = os.path.join("./data", "transcript.txt")

# Color scheme
COLORS = {
    'bg_primary': "#111827",
    'bg_secondary': "#1f2937",
    'accent': "#3b82f6",
    'accent_hover': "#60a5fa",
    'text_primary': "#f9fafb",
    'text_secondary': "#d1d5db",
    'highlight': "#fde68a",
    'button_bg': "#2563eb",
    'button_hover': "#3b82f6",
    'stop_button': "#ef4444",
    'stop_hover': "#f87171",
    'border': "#374151",
    'input_bg': "#1f2937"
}

class WhispererUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Whisperer - Speech Prompter")
        self.root.configure(bg=COLORS['bg_primary'])
        self.root.geometry("1000x750")
        self.root.minsize(1000, 900)
        self.root.resizable(False, False)
        self.header_font = ("Segoe UI", 26, "bold")
        self.subheader_font = ("Segoe UI", 14)
        self.body_font = ("Segoe UI", 12)
        self.button_font = ("Segoe UI", 12, "bold")
        self.prompter_font = ("Segoe UI", 14)
        style = ttk.Style()
        style.configure("Modern.TButton",
                        padding=10,
                        background=COLORS['button_bg'],
                        foreground=COLORS['text_primary'],
                        font=self.body_font)
        self.input_frame = tk.Frame(root, bg=COLORS['bg_primary'])
        self.prompter_frame = tk.Frame(root, bg=COLORS['bg_primary'])
        self.speaking_rate_var = tk.DoubleVar(value=1.0)
        self.speech_thread = None
        self.stop_requested = False
        self._create_input_frame()
        self._create_prompter_frame()
        self.show_input_frame()
    
    def _create_input_frame(self):
        # Keep the existing header elements
        header_label = tk.Label(self.input_frame, text="Whisperer", font=self.header_font,
                                bg=COLORS['bg_primary'], fg=COLORS['text_primary'])
        header_label.pack(pady=(30, 5))
        subtitle_label = tk.Label(self.input_frame, text="Enter your script below or upload a file",
                                  font=self.subheader_font, bg=COLORS['bg_primary'], fg=COLORS['text_secondary'])
        subtitle_label.pack(pady=(0, 25))
        separator = tk.Frame(self.input_frame, height=2, bg=COLORS['border'])
        separator.pack(fill=tk.X, padx=40, pady=10)
        
        # Script input area - unchanged
        script_frame = tk.Frame(self.input_frame, bg=COLORS['bg_primary'])
        script_frame.pack(fill=tk.X, padx=30, pady=(20, 15))
        script_label = tk.Label(script_frame, text="Script", font=self.subheader_font,
                                bg=COLORS['bg_primary'], fg=COLORS['text_primary'])
        script_label.pack(anchor='w')
        text_container = tk.Frame(script_frame, bg=COLORS['border'], padx=2, pady=2, highlightthickness=0)
        text_container.pack(fill=tk.X, pady=10)
        self.script_text = tk.Text(text_container, width=80, height=14, font=self.body_font,
                                    bg=COLORS['input_bg'], fg=COLORS['text_primary'], insertbackground=COLORS['text_primary'],
                                    relief="flat", padx=15, pady=15, wrap=tk.WORD)
        self.script_text.pack(fill=tk.X)
        
        # Controls frame - now only contains the upload button
        controls_frame = tk.Frame(self.input_frame, bg=COLORS['bg_primary'])
        controls_frame.pack(fill=tk.X, padx=40, pady=20)
        button_frame = tk.Frame(controls_frame, bg=COLORS['bg_primary'])
        button_frame.pack(fill=tk.X, pady=5)
        upload_btn = tk.Button(button_frame, text="⬆ Upload Script", command=self.upload_script,
                               font=self.body_font, bg=COLORS['button_bg'], fg=COLORS['text_primary'],
                               relief="flat", padx=20, pady=10, borderwidth=0, highlightthickness=0)
        upload_btn.pack(side=tk.LEFT, padx=0)
        upload_btn.bind("<Enter>", self.on_button_hover)
        upload_btn.bind("<Leave>", self.on_button_leave)
        
        # Create a separator (removed speaking rate slider, but keeping separator)
        separator2 = tk.Frame(self.input_frame, height=2, bg=COLORS['border'])
        separator2.pack(fill=tk.X, padx=40, pady=30)  # Increased padding to fill space
        
        # Play button frame - unchanged
        play_button_frame = tk.Frame(self.input_frame, bg=COLORS['bg_primary'], height=80)
        play_button_frame.pack(fill=tk.X, pady=20, padx=40)  # Increased padding
        play_button_frame.pack_propagate(False)
        play_btn = tk.Button(play_button_frame, text="▶ START PROMPTING", command=self.on_play,
                             font=("Segoe UI", 14, "bold"), bg=COLORS['accent'], fg=COLORS['text_primary'],
                             relief="flat", padx=80, pady=20, borderwidth=0, highlightthickness=0, cursor="hand2")
        play_btn.pack(expand=True)
        play_btn.bind("<Enter>", self.on_play_button_hover)
        play_btn.bind("<Leave>", lambda e: e.widget.configure(bg=COLORS['accent']))
    
    def _create_prompter_frame(self):
        header_frame = tk.Frame(self.prompter_frame, bg=COLORS['bg_primary'])
        header_frame.pack(fill=tk.X, padx=40, pady=(10, 0))
        header_label = tk.Label(header_frame, text="Follow the Highlighted Text",
                                  font=self.subheader_font, bg=COLORS['bg_primary'], fg=COLORS['text_primary'])
        header_label.pack(side=tk.LEFT)
        prompter_container = tk.Frame(self.prompter_frame, bg=COLORS['border'], padx=2, pady=2, height=700)
        prompter_container.pack(fill=tk.X, padx=40, pady=10)
        prompter_container.pack_propagate(False)
        self.prompter_area = scrolledtext.ScrolledText(prompter_container, font=self.prompter_font,
                                                        bg=COLORS['input_bg'], fg=COLORS['text_primary'],
                                                        relief="flat", padx=10, pady=10,
                                                        spacing1=8, spacing2=2, spacing3=8, wrap=tk.WORD)
        self.prompter_area.pack(fill=tk.BOTH, expand=True)
        self.prompter_area.tag_configure("current", background=COLORS['highlight'],
                                         foreground="#000000", font=(self.prompter_font[0], self.prompter_font[1], "bold"))
        stop_button_frame = tk.Frame(self.prompter_frame, bg=COLORS['bg_primary'])
        stop_button_frame.pack(pady=25)
        stop_btn = tk.Button(stop_button_frame, text="■ Stop", command=self.on_stop,
                             font=self.button_font, bg=COLORS['stop_button'], fg=COLORS['text_primary'],
                             relief="flat", padx=60, pady=15, borderwidth=0, highlightthickness=0, cursor="hand2")
        stop_btn.pack(pady=5)
        stop_btn.bind("<Enter>", self.on_stop_button_hover)
        stop_btn.bind("<Leave>", self.on_stop_button_leave)
    
    def update_rate_label(self, *args):
        self.rate_value_label.config(text=f"{self.speaking_rate_var.get():.1f}x")
    
    def show_input_frame(self):
        self.prompter_frame.pack_forget()
        self.input_frame.pack(fill=tk.BOTH, expand=True)
    
    def show_prompter_frame(self):
        self.input_frame.pack_forget()
        self.prompter_frame.pack(fill=tk.BOTH, expand=True)
    
    def on_button_hover(self, event):
        event.widget.configure(bg=COLORS['button_hover'])
    
    def on_button_leave(self, event):
        event.widget.configure(bg=COLORS['button_bg'])
    
    def on_play_button_hover(self, event):
        event.widget.configure(bg=COLORS['accent_hover'])
    
    def on_play_button_leave(self, event):
        event.widget.configure(bg=COLORS['button_bg'])
    
    def on_stop_button_hover(self, event):
        event.widget.configure(bg=COLORS['stop_hover'])
    
    def on_stop_button_leave(self, event):
        event.widget.configure(bg=COLORS['stop_button'])
    
    def upload_script(self):
        filepath = filedialog.askopenfilename(title="Select a Script File",
                                              filetypes=(("Text Files", "*.txt"), ("Word Documents", "*.docx"), ("PDF Files", "*.pdf")))
        if filepath:
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
            except Exception as e:
                messagebox.showerror("Error", f"Failed to open file: {e}")
                return
            self.script_text.delete("1.0", tk.END)
            self.script_text.insert(tk.END, content)
    
    def on_play(self):
        script = self.script_text.get("1.0", tk.END).strip()
        if not script:
            messagebox.showerror("Error", "Please enter or upload a script.")
            return
        # Use fixed speaking rate of 1.0 instead of the slider value
        rate = 1.0  
        self.stop_requested = False
        self.show_prompter_frame()
        self.speech_thread = threading.Thread(target=self.start_speech_process, args=(script, rate), daemon=True)
        self.speech_thread.start()
    
    def on_stop(self):
        self.stop_requested = True
        self.show_input_frame()
    
    def update_prompter(self, script_sentences, current_index):
        self.prompter_area.config(state=tk.NORMAL)
        self.prompter_area.delete("1.0", tk.END)
        for idx, sentence in enumerate(script_sentences):
            if idx == current_index:
                self.prompter_area.insert(tk.END, sentence + "\n", "current")
            else:
                self.prompter_area.insert(tk.END, sentence + "\n")
        self.prompter_area.config(state=tk.DISABLED)
        self.prompter_area.see(f"{current_index+1}.0")
    
    def start_speech_process(self, script, speaking_rate):
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            tts = TurkishTTS("./secrets/google-tts-key.json")
            # Pause/resume callbacks
            def pause_callback():
                logging.info("Pause callback triggered by SpeechMonitor.")
                tts.pause_feeding()
            def resume_callback():
                logging.info("Resume callback triggered by SpeechMonitor.")
                tts.resume_feeding()
            # Split full script into complete sentences for prompter updates.
            script_sentences = script.splitlines() if "\n" in script else script.split(". ")
            if script_sentences[-1].strip() == '':
                script_sentences = script_sentences[:-1]
            def sentence_update(new_index):
                if not self.stop_requested:
                    self.root.after(0, lambda: self.update_prompter(script_sentences, new_index))
            async def orchestrate():
                if self.stop_requested:
                    return
                deepgram_key = os.environ.get("DEEPGRAM_API_KEY")
                if not deepgram_key:
                    print("Deepgram API key not found!")
                    self.root.after(0, self.show_input_frame)
                    return
                stt_task = asyncio.create_task(run_deepgram(deepgram_key))
                speech_monitor = SpeechMonitor(TRANSCRIPT_FILE, expected_script=script,
                                               threshold=4.0, similarity_threshold=0.7)
                speech_monitor.set_pause_callback(pause_callback)
                speech_monitor.set_resume_callback(resume_callback)
                speech_monitor.set_sentence_update_callback(sentence_update)
                current_loop = asyncio.get_running_loop()
                tts_task = current_loop.run_in_executor(None, tts.stream_synthesize,
                                                         script, speaking_rate, ["headphone-class-device"], 2.0, 0)
                self.root.after(0, lambda: self.update_prompter(script_sentences, 0))
                async def check_stop():
                    while not self.stop_requested:
                        await asyncio.sleep(0.5)
                    stt_task.cancel()
                    monitor_task.cancel()
                    return
                stop_checker = asyncio.create_task(check_stop())
                await asyncio.gather(stt_task, monitor_task, tts_task, stop_checker, return_exceptions=True)
            try:
                loop.run_until_complete(orchestrate())
            except Exception as ex:
                print("Error during orchestration:", ex)
            finally:
                loop.close()
        except Exception as e:
            print(f"Error in speech process: {e}")
            self.root.after(0, self.show_input_frame)

def main():
    root = tk.Tk()
    app = WhispererUI(root)
    root.mainloop()

if __name__ == "__main__":
    dotenv.load_dotenv("./secrets/.env")
    main()
