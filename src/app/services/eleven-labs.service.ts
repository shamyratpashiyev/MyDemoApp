import { Injectable } from '@angular/core';
import { ElevenLabsClient } from 'elevenlabs';
import { from, Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ElevenLabsService {
  private elevenLabs!: ElevenLabsClient;
  private ELEVENLABS_API_KEY: string = 'sk_bbbb8d9f45efaa05f5083dbc7fa4c0bc40926dc1fc0e1beb'; // TODO: Replace with your actual key

  constructor() {
    this.elevenLabs = new ElevenLabsClient({
      apiKey: this.ELEVENLABS_API_KEY
    });
  }

  textToSpeech(text: string): Observable<Blob> {
    const audioStreamPromise = this.elevenLabs.generate({
      voice: "Rachel",
      text,
      model_id: "eleven_multilingual_v2"
    });

    return from(audioStreamPromise).pipe(
      switchMap(async (audioStream) => {
        const chunks: Uint8Array[] = [];
        for await (const chunk of audioStream) {
          chunks.push(chunk);
        }
        
        return new Blob(chunks, { type: 'audio/mpeg' });
      }),
      catchError(error => {
        console.error('Error generating speech:', error);
        return of(new Blob()); // Return empty blob on error
      })
    );
  }
}
