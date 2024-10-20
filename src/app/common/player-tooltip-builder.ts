import { RED_GP_UPPER_BOUNDARY, RED_PIM_LOWER_BOUNDARY } from 'src/constants';
import { DecimalPipe } from '@angular/common';
import { TeamGameInformation } from '../interfaces/team-game-information';
import { Utils } from './utils';
import { TeamStatsDTO } from '../interfaces/team-stats-dto';
import { PlayerExpectedFantasyPointsDTO } from '../interfaces/player-expected-fantasy-points-dto';
import { GamesUtils } from './games-utils';
import { PlayerCommonRecord } from '../interfaces/player-common-record';

export module PlayerTooltipBuilder {
  export function generatePlayerTooltip(
    player: PlayerCommonRecord,
    filteredTeamGames: Map<number, TeamGameInformation[]>,
    teamStats: TeamStatsDTO[],
    playerGamesOfoMap: Map<number, PlayerExpectedFantasyPointsDTO[]> | undefined
  ): string | null {
    const numberPipe: DecimalPipe = new DecimalPipe('en-US');

    let header: string = `
      <div style="font-size: 16px; line-height: 19px; text-align: center;">
        ${player.playerName} (${player.position}, ${player.teamObject.teamName})
      </div>`;

    let forecastPimColor: string =
      player.playerObject.forecastPIM! < RED_PIM_LOWER_BOUNDARY
        ? 'white'
        : '#ff7e7e';
    let forecastGPColor: string =
      player.playerObject.forecastGamesPlayed! >= RED_GP_UPPER_BOUNDARY
        ? 'white'
        : '#ff7e7e';

    let forecast: string = `
    <div>Прогноз на сезон:<div>
    <table class="tooltip-table">
      <thead>
        <tr>
          <th style="color:${forecastGPColor}">GP</th>
          <th>G</th>
          <th>A</th>
          <th style="color:${forecastPimColor}">PIM</th>
          <th>+-</th>
          <th>W</th>
          <th>L</th>
          <th>CS</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center; vertical-align: middle; color:${forecastGPColor}">${
      numberPipe.transform(player.playerObject.forecastGamesPlayed, '1.0-0') ??
      '-'
    }</td>
          <td style="text-align: center; vertical-align: middle;">${
            numberPipe.transform(player.playerObject.forecastGoals, '1.0-0') ??
            '-'
          }</td>
          <td style="text-align: center; vertical-align: middle;">${
            numberPipe.transform(
              player.playerObject.forecastAssists,
              '1.0-0'
            ) ?? '-'
          }</td>
          <td style="text-align: center; vertical-align: middle; color:${forecastPimColor}">${
      numberPipe.transform(player.playerObject.forecastPIM, '1.0-0') ?? '-'
    }</td>
          <td style="text-align: center; vertical-align: middle;">${
            numberPipe.transform(
              player.playerObject.forecastPlusMinus,
              '1.0-0'
            ) ?? '-'
          }</td>
          <td style="text-align: center; vertical-align: middle;">${
            numberPipe.transform(
              player.playerObject.forecastWins,
              '1.0-0'
            ) ?? '-'
          }</td>
          <td style="text-align: center; vertical-align: middle;">${
            numberPipe.transform(
              player.playerObject.forecastLosses,
              '1.0-0'
            ) ?? '-'
          }</td>
          <td style="text-align: center; vertical-align: middle;">${
            numberPipe.transform(
              player.playerObject.forecastShutouts,
              '1.0-0'
            ) ?? '-'
          }</td>
        </tr
      </tbody>
    </table>
    `;

    let form: string = `
    <div>Форма:<div>
    <table class="tooltip-table">
      <thead>
        <tr>
          <th>GP</th>
          <th>G</th>
          <th>A</th>
          <th>PIM</th>
          <th>+-</th>
          <th>ПП</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center; vertical-align: middle;">${
            player.playerObject.formGamesPlayed ?? '-'
          }</td>
          <td style="text-align: center; vertical-align: middle;">${
            player.playerObject.formGoals ?? '-'
          }</td>
          <td style="text-align: center; vertical-align: middle;">${
            player.playerObject.formAssists ?? '-'
          }</td>
          <td style="text-align: center; vertical-align: middle;">${
            player.playerObject.formPIM ?? '-'
          }</td>
          <td style="text-align: center; vertical-align: middle;">${
            player.playerObject.formPlusMinus ?? '-'
          }</td>
          <td style="text-align: center; vertical-align: middle;">${
            player.powerPlayNumber
          }</td>
        </tr
      </tbody>
    </table>
    `;

    let teamForm: string = `
    <div>Форма команды:<div>
    <table class="tooltip-table">
      <thead>
        <tr>
          <th>%Очк</th>
          <th>СрЗаб</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center; vertical-align: middle;">${
            player.teamObject.teamFormWinPercentage
          }</td>
          <td style="text-align: center; vertical-align: middle;">${player.teamObject.teamGoalsForm.toFixed(
            1
          )}</td>
        </tr
      </tbody>
    </table>
    `;

    let teamGame: TeamGameInformation | undefined = filteredTeamGames
      .get(player.teamObject.teamID)
      ?.sort((n1, n2) => Utils.sortTypes(n1.gameDate, n2.gameDate))[0];

    let opponentTeam: TeamStatsDTO | undefined = teamStats.find(
      (x) => x.teamID == teamGame?.opponentTeamID
    );
    let opponentAcronym: string = teamGame?.isHome
      ? `${opponentTeam?.teamAcronym}`
      : `@${opponentTeam?.teamAcronym}`;

    let teamWinColor: string = GamesUtils.getTooltipWinChanceSectionClass(
      teamGame?.winChance!
    );

    let nearestGameOFO: number = playerGamesOfoMap
      ?.get(player.playerObject.playerID)
      ?.find((x) => x.gameID == teamGame?.gameID)?.playerExpectedFantasyPoints!;

    let opponentInfo: string = `
    <div>Ближайший соперник: ${opponentAcronym}, <span style="color:${teamWinColor}">Поб: ${Math.round(
      teamGame?.winChance!
    )}%</span><div>
    <table class="tooltip-table">
      <thead>
        <tr>
          <th>%Очк</th>
          <th>СрЗаб</th>
          <th> ОФО Игрока</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center; vertical-align: middle;">${
            opponentTeam?.teamFormWinPercentage
          }</td>
          <td style="text-align: center; vertical-align: middle;">${
            opponentTeam != null ? opponentTeam.teamGoalsForm.toFixed(1) : 0
          }</td>
          <td style="text-align: center; vertical-align: middle;"> ${numberPipe.transform(
            nearestGameOFO,
            '1.0-1'
          )}</td>
        </tr
      </tbody>
    </table>
    `;

    return `
    <div style="font-family: Inter;
                font-size: 12px;
                font-weight: 500;
                line-height: 15px;
                letter-spacing: 0em;
                text-align: left;"
                >
      ${header} <br>
      ${forecast} <br>
      ${form} <br>
      ${teamForm} <br>
      ${opponentInfo}
    </div>`;
  }
}
