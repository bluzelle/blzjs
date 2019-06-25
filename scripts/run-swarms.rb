#!/usr/bin/ruby -w

# 1. swarmDB is compiled
# 2. BluzelleESR is compiled
# 3. ganache is running (see deploy-ethereum.js)

# npx ganache-cli --account="0x1f0d511e990ddbfec302e266d62542384f755f6cc6b3161b2e49a2a4e6c4be3d,100000000000000000000"


#these mirror the keys in src/test/main.test.js
master_pub_key = "MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEE/Yeq9sYdyeou+TnNEJjMnuntrzqcFIfIHd49LW461d55TY4hVX66ZXXGvAWRqMVMeELtYuKGYU44bPaxTb1ig=="

# this private key is included here only for reference purposes
master_priv_key = "MHQCAQEEIEOd7E9zSxgJjtpGzK/gHl0vVSOZ2iF3TY50InD67BnHoAcGBSuBBAAKoUQDQgAEE/Yeq9sYdyeou+TnNEJjMnuntrzqcFIfIHd49LW461d55TY4hVX66ZXXGvAWRqMVMeELtYuKGYU44bPaxTb1ig=="


if(ARGV.length == 0)
  raise "No swarms given. Example: run './run-swarm.rb 4 3' to create one swarm with four nodes and one swarm with three nodes."
end

Dir.chdir '..'




$execute_commands = []

def run_hidden(cmd)
  $execute_commands.push cmd + ' &'
end

def run_in_tab(cmd)
  mac = "osascript -e 'tell app \"Terminal\" \n do script \"" + cmd + "\" \n end tell'"

  # haven't tested this on linux
  linux = "gnome-terminal -- bash -c \"" + cmd + "\""

  script = (/darwin/ =~ RUBY_PLATFORM) != nil ? mac : linux

  $execute_commands.push script
end


`rm -rf swarmDB/local/nodes/`
base_dir = `pwd`.strip


i = 0

(0...ARGV.length).each do |n|

  peers_file = base_dir + "/swarmDB/local/nodes/peers#{n}.json"
  swarm_file = base_dir + "/swarmDB/local/nodes/swarm#{n}.json"

  peers = []

  swarm_id = 'swarm' + n.to_s

  (0...ARGV[n].to_i).each do 

    node_name = "node" + i.to_s
    node_dir = base_dir + "/swarmDB/" + "local/nodes/#{node_name}"

    `mkdir -p #{node_dir}`
    Dir.chdir(node_dir);

    `cp #{base_dir}/swarmDB/build/output/swarm ./`
    `#{base_dir}/swarmDB/scripts/generate-key`

    lines = []
    File.readlines(node_dir + "/.state/public-key.pem").each do |line|
      lines.push(line)
    end

    node_uuid = lines[1..-2].map{|x| x.strip}.join()
    peers.push %({
        "name": "node#{i}", 
        "host": "127.0.0.1", 
        "port": #{50000+i}, 
        "http_port": #{5080+i}, 
        "uuid": "#{node_uuid}"
      })

    File.write(node_dir + "/bluzelle.json", %({
      "listener_address" : "127.0.0.1",
      "listener_port" : #{50000+i},
      "ethereum" : "0xddbd2b932c763ba5b1b7ae3b362eac3e8d40121a",
      "ethereum_io_api_token" : "YN4KEEE6KU6KVQNC6JFR4BH3USKWH23INF",
      "bootstrap_file" : "#{peers_file}",
      "debug_logging" : true,
      "log_to_stdout" : true,
      "use_pbft": true,
      "audit_enabled": true,
      "chaos_testing_enabled": false,
      "crypto_enabled_outgoing" : true,
      "crypto_enabled_incoming" : true,
      "monitor_address": "localhost",
      "monitor_port": 8125,
      "ws_idle_timeout": 1000000,
      "swarm_id": "#{swarm_id}",
      "owner_public_key": "#{master_pub_key}"
      }))


    run_in_tab "cd #{node_dir}; #{node_dir}/swarm -c #{node_dir}/bluzelle.json; bash"

    i += 1
  end


  peers_json = '[' + peers.join(",\n") + ']'

  File.write(peers_file, peers_json)

  swarm_json = %({"swarm_id":"#{swarm_id}","peers":#{peers_json}})

  File.write(swarm_file, swarm_json)

end



$execute_commands.each do |command|
  `#{command}`
end


Dir.chdir base_dir + '/BluzelleESR'
puts `./node_modules/.bin/truffle exec ../scripts/deploy-ethereum.js`;


