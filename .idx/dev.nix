{ pkgs }: {
  channel = "stable-25.05";
  packages = [
    pkgs.nodejs_22
    pkgs.gh
  ];
  idx.extensions = [


    "Anthropic.claude-code"
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "bash"
          "-c"
          "npm run dev -- --port $PORT --hostname 0.0.0.0 2>&1 | tee /home/user/modern-chord-charts/dev-server.log"
        ];
        manager = "web";
      };
    };
  };
}
