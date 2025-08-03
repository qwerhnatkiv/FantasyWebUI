import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/services/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  protected usernameFormControl: FormControl = new FormControl('', [Validators.required]);
  protected passwordFormControl: FormControl = new FormControl('', [Validators.required]);
  protected matcher: ErrorStateMatcher = new ErrorStateMatcher();

  constructor(private auth: AuthService, private router: Router) {}

  /**
   * Submits login form and redirects to main view if login is successful
   */
  public login(): void {
    this.auth.login(this.usernameFormControl.value, this.passwordFormControl.value).subscribe({
      next: () => this.router.navigate(['/main']),
      error: (err) => (console.log(err)),
    });
  }
}
